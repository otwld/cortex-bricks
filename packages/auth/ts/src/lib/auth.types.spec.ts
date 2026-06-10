import {
  AUTH_IDENTITY_PROVIDERS,
  AUTH_SOCIAL_PROVIDERS,
  type AuthSessionDto,
} from './auth.types';

describe('auth contracts', () => {
  it('keeps credentials and social providers distinct', () => {
    expect(AUTH_SOCIAL_PROVIDERS).toEqual(['google', 'github']);
    expect(AUTH_IDENTITY_PROVIDERS).toEqual([
      'credentials',
      'google',
      'github',
    ]);
  });

  it('models guest sessions without a user payload', () => {
    const session: AuthSessionDto = {
      authenticated: false,
      expiresAt: null,
      user: null,
    };

    expect(session.authenticated).toBe(false);
    expect(session.user).toBeNull();
  });
});
