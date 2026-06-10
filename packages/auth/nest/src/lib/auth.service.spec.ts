import {
  ForbiddenException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createMongoAbility } from '@casl/ability';
import { Types } from 'mongoose';
import { AuthService } from './auth.service';
import { CaslAbilityFactory } from './casl/casl-ability.factory';
import { AuthModuleOptions } from './config/auth-module-options';
import type { AuthRedirectResponse } from './tokens/token.service';
import { UserDocument } from './user/user.schema';

class TestAbilityFactory extends CaslAbilityFactory {
  createForUser() {
    return createMongoAbility();
  }
}

type AuthUserServiceMock = ConstructorParameters<typeof AuthService>[0];
type AuthTokenServiceMock = ConstructorParameters<typeof AuthService>[1];
type AuthRefreshTokenRepositoryMock = ConstructorParameters<typeof AuthService>[2];

const USER_ID = '000000000000000000000001';
const REGISTERED_USER_ID = '000000000000000000000002';

class AuthResponseMock implements AuthRedirectResponse {
  public readonly redirect = vi.fn(() => undefined);
  public readonly cookie = vi.fn(() => this);
  public readonly clearCookie = vi.fn(() => this);
}

describe(AuthService.name, () => {
  const originalNodeEnv = process.env['NODE_ENV'];

  afterEach(() => {
    process.env['NODE_ENV'] = originalNodeEnv;
    vi.restoreAllMocks();
  });

  function createUser(overrides: Partial<UserDocument> = {}) {
    return {
      _id: new Types.ObjectId(USER_ID),
      email: 'dev@example.com',
      emailVerified: true,
      roles: [],
      permissions: ['*'],
      ...overrides,
    } as UserDocument;
  }

  function createResponse(): AuthResponseMock {
    return new AuthResponseMock();
  }

  function createService(options: Partial<AuthModuleOptions> = {}) {
    const userService = {
      findByEmail: vi.fn(),
      create: vi.fn(),
      setLastLogin: vi.fn(),
      findById: vi.fn(),
      hashPassword: vi.fn(),
      setPasswordResetToken: vi.fn(),
      clearPasswordResetToken: vi.fn(),
      findByPasswordResetTokenHash: vi.fn(),
      setPassword: vi.fn(),
      setEmailVerified: vi.fn(),
      setEmailVerificationToken: vi.fn(),
    } satisfies AuthUserServiceMock;
    const tokenService = {
      signAccessToken: vi.fn().mockReturnValue('access-jwt'),
      signRefreshToken: vi.fn().mockReturnValue('refresh-jwt'),
      verifyRefreshToken: vi
        .fn()
        .mockReturnValue({ sub: USER_ID, email: 'dev@example.com' }),
      hashToken: vi.fn((token: string) => `hash:${token}`),
      setAuthCookies: vi.fn(),
      clearAuthCookies: vi.fn(),
    } satisfies AuthTokenServiceMock;
    const refreshTokenRepository = {
      create: vi.fn(),
      findByHash: vi.fn(),
      revokeById: vi.fn(),
      revokeAllForUser: vi.fn(),
    } satisfies AuthRefreshTokenRepositoryMock;
    const service = new AuthService(
      userService,
      tokenService,
      refreshTokenRepository,
      {
        jwtSecret: 'access-secret',
        jwtRefreshSecret: 'refresh-secret',
        abilityFactory: TestAbilityFactory,
        ...options,
      },
    );

    return { service, userService, tokenService, refreshTokenRepository };
  }

  it('creates a real session for an enabled development login', async () => {
    process.env['NODE_ENV'] = 'development';
    const { service, userService, tokenService } = createService({
      devLogin: {
        enabled: true,
        email: 'dev@example.com',
        password: 'password',
        firstName: 'Dev',
        lastName: 'User',
        permissions: ['*'],
      },
    } as Partial<AuthModuleOptions>);
    const user = createUser();
    userService.findByEmail.mockResolvedValue(user);
    const res = createResponse();

    await expect(
      service.devLogin(
        { email: 'dev@example.com', password: 'password' },
        res,
      ),
    ).resolves.toBe(user);

    expect(userService.create).not.toHaveBeenCalled();
    expect(userService.setLastLogin).toHaveBeenCalledWith(USER_ID);
    expect(tokenService.setAuthCookies).toHaveBeenCalledWith(
      res,
      'access-jwt',
      'refresh-jwt',
      {
        refreshMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
      },
    );
  });

  it('creates the configured development user before starting a session', async () => {
    process.env['NODE_ENV'] = 'development';
    const { service, userService } = createService({
      devLogin: {
        enabled: true,
        email: 'dev@example.com',
        password: 'password',
        firstName: 'Dev',
        lastName: 'User',
        permissions: ['read:Dashboard'],
      },
    } as Partial<AuthModuleOptions>);
    const created = createUser({ permissions: ['read:Dashboard'] });
    userService.findByEmail.mockResolvedValue(null);
    userService.create.mockResolvedValue(created);

    await service.devLogin(
      { email: 'dev@example.com', password: 'password' },
      createResponse(),
    );

    expect(userService.create).toHaveBeenCalledWith({
      email: 'dev@example.com',
      firstName: 'Dev',
      lastName: 'User',
      emailVerified: true,
      permissions: ['read:Dashboard'],
      roles: [],
    });
  });

  it('blocks development login in production', async () => {
    process.env['NODE_ENV'] = 'production';
    const { service } = createService({
      devLogin: {
        enabled: true,
        email: 'dev@example.com',
        password: 'password',
      },
    } as Partial<AuthModuleOptions>);

    await expect(
      service.devLogin(
        { email: 'dev@example.com', password: 'password' },
        createResponse(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects invalid development login credentials', async () => {
    process.env['NODE_ENV'] = 'development';
    const { service } = createService({
      devLogin: {
        enabled: true,
        email: 'dev@example.com',
        password: 'password',
      },
    } as Partial<AuthModuleOptions>);

    await expect(
      service.devLogin(
        { email: 'dev@example.com', password: 'wrong' },
        createResponse(),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('stores a signed refresh JWT so refresh can verify the cookie later', async () => {
    const { service, tokenService, refreshTokenRepository } = createService();
    const user = createUser();

    await service.login(user, createResponse());

    expect(tokenService.signRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: USER_ID,
        email: 'dev@example.com',
        jti: expect.any(String),
      }),
    );
    expect(refreshTokenRepository.create).toHaveBeenCalledWith(
      USER_ID,
      'hash:refresh-jwt',
      expect.any(Date),
      undefined,
      undefined,
    );
    expect(tokenService.setAuthCookies).toHaveBeenCalledWith(
      expect.any(Object),
      'access-jwt',
      'refresh-jwt',
      {
        refreshMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
      },
    );
  });

  it('uses configured refreshTokenTtl for the refresh cookie maxAge', async () => {
    const { service, tokenService } = createService({ refreshTokenTtl: '2h' });
    const res = createResponse();

    await service.login(createUser(), res);

    expect(tokenService.setAuthCookies).toHaveBeenCalledWith(
      res,
      'access-jwt',
      'refresh-jwt',
      { refreshMaxAgeMs: 7_200_000 },
    );
  });

  it('adds a unique id to each refresh JWT payload', async () => {
    const { service, tokenService } = createService();
    tokenService.signRefreshToken.mockImplementation(
      (payload: { jti?: string }) => `refresh:${payload.jti}`,
    );
    const user = createUser();

    await service.login(user, createResponse());
    await service.login(user, createResponse());

    const firstPayload = tokenService.signRefreshToken.mock.calls[0][0];
    const secondPayload = tokenService.signRefreshToken.mock.calls[1][0];
    expect(firstPayload).toMatchObject({
      sub: USER_ID,
      email: 'dev@example.com',
      jti: expect.any(String),
    });
    expect(secondPayload).toMatchObject({
      sub: USER_ID,
      email: 'dev@example.com',
      jti: expect.any(String),
    });
    expect(firstPayload.jti).not.toBe(secondPayload.jti);
    expect(tokenService.setAuthCookies).toHaveBeenNthCalledWith(
      1,
      expect.any(Object),
      'access-jwt',
      `refresh:${firstPayload.jti}`,
      {
        refreshMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
      },
    );
    expect(tokenService.setAuthCookies).toHaveBeenNthCalledWith(
      2,
      expect.any(Object),
      'access-jwt',
      `refresh:${secondPayload.jti}`,
      {
        refreshMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
      },
    );
  });

  it('calls onRegistered callback after successful registration', async () => {
    const onRegistered = vi.fn().mockResolvedValue(undefined);
    const { service, userService } = createService({ mail: { onRegistered } });
    userService.findByEmail.mockResolvedValue(null);
    userService.hashPassword.mockResolvedValue('hashed');
    userService.create.mockResolvedValue(createUser({
      _id: new Types.ObjectId(REGISTERED_USER_ID),
      email: 'user@example.com',
      firstName: 'Alice',
    }));

    await service.register({ email: 'user@example.com', password: 'pass' });

    expect(onRegistered).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        name: 'Alice',
        verificationToken: expect.any(String),
      }),
    );
  });

  it('stores hashed email verification tokens while sending the raw code', async () => {
    const onRegistered = vi.fn().mockResolvedValue(undefined);
    const { service, userService } = createService({ mail: { onRegistered } });
    userService.findByEmail.mockResolvedValue(null);
    userService.hashPassword.mockResolvedValue('hashed');
    userService.create.mockResolvedValue(createUser({
      _id: new Types.ObjectId(REGISTERED_USER_ID),
      email: 'user@example.com',
      firstName: 'Alice',
    }));

    await service.register({
      email: 'user@example.com',
      password: 'password123',
    });

    const created = userService.create.mock.calls[0][0];
    const mailed = onRegistered.mock.calls[0][0];
    expect(mailed.verificationToken).toMatch(/^\d{6}$/);
    expect(created.emailVerificationToken).toBe(
      `hash:${mailed.verificationToken}`,
    );
  });

  it('does not fail registration when onRegistered callback rejects', async () => {
    const onRegistered = vi
      .fn()
      .mockRejectedValue(new Error('postal unavailable'));
    const warnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const { service, userService } = createService({ mail: { onRegistered } });
    const user = createUser({
      _id: new Types.ObjectId(REGISTERED_USER_ID),
      email: 'user@example.com',
      firstName: 'Alice',
    });
    userService.findByEmail.mockResolvedValue(null);
    userService.hashPassword.mockResolvedValue('hashed');
    userService.create.mockResolvedValue(user);

    await expect(
      service.register({ email: 'user@example.com', password: 'pass' }),
    ).resolves.toBe(user);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('onRegistered'),
    );
  });

  it('does not throw when no mail config is provided on registration', async () => {
    const { service, userService } = createService();
    userService.findByEmail.mockResolvedValue(null);
    userService.hashPassword.mockResolvedValue('hashed');
    userService.create.mockResolvedValue(createUser({
      _id: new Types.ObjectId(REGISTERED_USER_ID),
      email: 'user@example.com',
    }));

    await expect(
      service.register({ email: 'user@example.com', password: 'pass' }),
    ).resolves.not.toThrow();
  });

  it('calls onForgotPassword callback after generating reset token', async () => {
    const onForgotPassword = vi.fn().mockResolvedValue(undefined);
    const { service, userService } = createService({
      mail: { onForgotPassword },
    });
    const user = createUser({ passwordResetToken: undefined });
    userService.findByEmail.mockResolvedValue(user);

    await service.forgotPassword('dev@example.com');

    expect(onForgotPassword).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'dev@example.com',
        resetToken: expect.any(String),
      }),
    );
  });

  it('resets passwords through UserService without reading repository internals', async () => {
    const { service, userService, tokenService } = createService({
      mail: { onPasswordReset: vi.fn().mockResolvedValue(undefined) },
    });
    const user = createUser({ email: 'reset@example.com' });
    userService.findByPasswordResetTokenHash.mockResolvedValue(user);
    userService.hashPassword.mockResolvedValue('new-password-hash');

    await service.resetPassword('raw-reset-token', 'new-password123');

    expect(userService.findByPasswordResetTokenHash).toHaveBeenCalledWith(
      'hash:raw-reset-token',
    );
    expect(userService.setPassword).toHaveBeenCalledWith(
      USER_ID,
      'new-password-hash',
    );
    expect(userService.clearPasswordResetToken).toHaveBeenCalledWith(USER_ID);
    expect(tokenService.hashToken).toHaveBeenCalledWith('raw-reset-token');
  });

  it('does not fail forgotPassword when onForgotPassword callback rejects after storing token', async () => {
    const onForgotPassword = vi
      .fn()
      .mockRejectedValue(new Error('postal unavailable'));
    const warnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const { service, userService } = createService({
      mail: { onForgotPassword },
    });
    userService.findByEmail.mockResolvedValue(createUser());

    await expect(
      service.forgotPassword('dev@example.com'),
    ).resolves.toBeUndefined();

    expect(userService.setPasswordResetToken).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('onForgotPassword'),
    );
  });

  it('verifies email by comparing hashed one-time codes', async () => {
    const { service, userService, tokenService } = createService();
    userService.findById.mockResolvedValue(
      createUser({
        emailVerified: false,
        emailVerificationToken: 'hash:123456',
        emailVerificationExpires: new Date(Date.now() + 60_000),
      }),
    );

    await service.verifyEmail(USER_ID, '123456');

    expect(tokenService.hashToken).toHaveBeenCalledWith('123456');
    expect(userService.setEmailVerified).toHaveBeenCalledWith(USER_ID);
  });

  it('calls onVerificationResent callback after generating new verification code', async () => {
    const onVerificationResent = vi.fn().mockResolvedValue(undefined);
    const { service, userService } = createService({
      mail: { onVerificationResent },
    });
    userService.findById.mockResolvedValue(
      createUser({ email: 'dev@example.com', firstName: 'Dev' }),
    );

    await service.resendVerification(USER_ID);

    const mailed = onVerificationResent.mock.calls[0][0];
    expect(mailed.verificationToken).toMatch(/^\d{6}$/);
    expect(userService.setEmailVerificationToken).toHaveBeenCalledWith(
      USER_ID,
      `hash:${mailed.verificationToken}`,
      expect.any(Date),
    );
    expect(onVerificationResent).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'dev@example.com',
        verificationToken: expect.any(String),
      }),
    );
  });

  it('redirects OAuth invitation callbacks back to invitation completion with state', async () => {
    const { service } = createService({
      invitationOAuthRedirect: '/accept-invitation/oauth-complete',
    });
    const user = createUser();
    const res = createResponse();

    await service.oauthCallback(user, res, undefined, undefined, 'oauth-state');

    expect(res.clearCookie).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(
      '/accept-invitation/oauth-complete?state=oauth-state',
    );
  });

  it('uses the default OAuth redirect when no invitation cookie is present', async () => {
    const { service } = createService({ afterOAuthRedirect: '/dashboard' });
    const user = createUser();
    const res = createResponse();

    await service.oauthCallback(user, res);

    expect(res.redirect).toHaveBeenCalledWith('/dashboard');
  });
});
