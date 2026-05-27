import { BadRequestException } from '@nestjs/common';
import { UserDocument } from '@otwld/nest-auth';
import {
  UserAccountStatus,
  UserInvitationStatus,
} from '@otwld/ts-users';
import { ClientSession, Model } from 'mongoose';
import { AuthAccountRepository } from './auth-account.repository';
import { UserInvitationRepository } from './user-invitations.repository';
import { UsersRepository } from './users.repository';

describe('users persistence helpers', () => {
  it('maps profile documents into safe profile DTOs', () => {
    const repository = new UsersRepository({} as any);
    const profile = repository.toProfileDto({
      _id: 'profile-1',
      authUserId: 'auth-1',
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      displayName: 'Ada Lovelace',
      accountStatus: UserAccountStatus.Active,
      invitationStatus: UserInvitationStatus.Pending,
      roles: [],
      permissions: [],
      createdAt: new Date('2026-05-07T00:00:00.000Z'),
      updatedAt: new Date('2026-05-07T00:00:00.000Z'),
    } as any);

    expect(profile).toMatchObject({
      id: 'profile-1',
      authUserId: 'auth-1',
      email: 'ada@example.com',
      displayName: 'Ada Lovelace',
      accountStatus: UserAccountStatus.Active,
      invitationStatus: UserInvitationStatus.Pending,
    });
  });

  it('hashes raw invitation tokens before persistence lookup', () => {
    const repository = new UserInvitationRepository({} as any);
    const hash = repository.hashToken('raw-token');

    expect(hash).toHaveLength(64);
    expect(hash).not.toBe('raw-token');
  });

  it('clears password reset fields after a reset token is used', async () => {
    const user = { _id: 'auth-1', email: 'ada@example.com' };
    const execFindOne = vi
      .fn()
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(null);
    const execUpdate = vi.fn().mockResolvedValue(undefined);
    const userModel = {
      findOne: vi.fn().mockReturnValue({ exec: execFindOne }),
      findByIdAndUpdate: vi.fn().mockReturnValue({ exec: execUpdate }),
    };
    const repository = new AuthAccountRepository(userModel as any);

    await expect(
      repository.resetPassword('reset-token', 'new-password'),
    ).resolves.toEqual(user);
    await expect(
      repository.resetPassword('reset-token', 'new-password'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'auth-1',
      expect.objectContaining({
        $unset: { passwordResetToken: '', passwordResetExpires: '' },
      }),
    );
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
  });

  it('clears login credentials and assignments when disabling an auth account', async () => {
    const execUpdate = vi.fn().mockResolvedValue({ _id: 'auth-1' });
    const userModel = {
      findByIdAndUpdate: vi.fn().mockReturnValue({ exec: execUpdate }),
    };
    const repository = new AuthAccountRepository(
      userModel as unknown as Model<UserDocument>,
    );
    const session = { id: 'session-1' } as unknown as ClientSession;

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
