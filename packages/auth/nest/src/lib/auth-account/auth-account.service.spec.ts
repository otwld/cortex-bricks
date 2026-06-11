import { BadRequestException } from '@nestjs/common';
import type { ClientSession } from 'mongoose';
import { AuthAccountRepository } from './auth-account.repository';
import { AuthAccountService } from './auth-account.service';

describe(AuthAccountService.name, () => {
  it('stores only a hash when requesting a password reset', async () => {
    const account = { _id: 'auth-1', email: 'ada@example.com' };
    const repository = {
      findByEmail: vi.fn().mockResolvedValue(account),
      updateById: vi.fn().mockResolvedValue(account),
    } as unknown as AuthAccountRepository;
    const service = new AuthAccountService(repository);

    const result = await service.requestPasswordReset('ada@example.com');

    expect(result?.rawToken).toBeTruthy();
    expect(repository.updateById).toHaveBeenCalledWith(
      'auth-1',
      expect.objectContaining({
        passwordResetToken: expect.not.stringMatching(result?.rawToken ?? ''),
        passwordResetExpires: expect.any(Date),
      }),
    );
  });

  it('rejects invalid reset tokens before changing a password', async () => {
    const repository = {
      findOne: vi.fn(),
      findByPasswordResetTokenHash: vi.fn().mockResolvedValue(null),
    } as unknown as AuthAccountRepository;
    const service = new AuthAccountService(repository);

    await expect(service.resetPassword('missing-token', 'new-password')).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe(AuthAccountRepository.name, () => {
  it('clears login credentials and assignments when disabling an auth account', async () => {
    const execUpdate = vi.fn().mockResolvedValue({ _id: 'auth-1' });
    const userModel = {
      findByIdAndUpdate: vi.fn().mockReturnValue({ exec: execUpdate }),
    };
    const repository = new AuthAccountRepository(userModel as never);
    const session = { id: 'session-1' } as ClientSession;

    await repository.disableAccount('auth-1', session);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'auth-1',
      {
        emailVerified: false,
        roles: [],
        permissions: [],
        $unset: {
          password: '',
          googleId: '',
          githubId: '',
          passwordResetToken: '',
          passwordResetExpires: '',
          emailVerificationToken: '',
          emailVerificationExpires: '',
        },
      },
      { new: true, session },
    );
  });
});
