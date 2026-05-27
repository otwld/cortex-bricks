import { authRoutes } from './auth.routes';
import { ResetPasswordPage } from './reset-password/reset-password';

describe('authRoutes', () => {
  it('exposes the password reset token page under the auth route tree', async () => {
    const route = authRoutes.find((candidate) => candidate.path === 'reset-password');

    expect(route?.loadComponent).toEqual(expect.any(Function));
    await expect(route?.loadComponent?.()).resolves.toBe(ResetPasswordPage);
  });
});
