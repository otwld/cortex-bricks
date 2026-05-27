import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';

describe(LocalStrategy.name, () => {
  it('accepts email or username through the local identifier field', async () => {
    const user = { _id: 'u1', email: 'ada@example.com', password: 'hash' };
    const userService = {
      findByEmailOrUsernameWithPassword: vi.fn().mockResolvedValue(user),
      validatePassword: vi.fn().mockResolvedValue(true),
    };
    const strategy = new LocalStrategy(userService as any);

    await expect(strategy.validate('ada', 'secret')).resolves.toBe(user);

    expect(userService.findByEmailOrUsernameWithPassword).toHaveBeenCalledWith(
      'ada',
    );
  });

  it('rejects an unknown local identifier', async () => {
    const userService = {
      findByEmailOrUsernameWithPassword: vi.fn().mockResolvedValue(null),
      validatePassword: vi.fn(),
    };
    const strategy = new LocalStrategy(userService as any);

    await expect(strategy.validate('missing', 'secret')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
