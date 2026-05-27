import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard, PoliciesGuard } from '@otwld/nest-auth';
import { UserAccountStatus, UserOAuthProvider } from '@otwld/ts-users';
import { UsersController } from './users.controller';
import { canManageUsers, canReadUsers } from './users.policies';
import {
  acceptInvitationCredentialsRequestSchema,
  createUserRequestSchema,
  requestUserPasswordResetRequestSchema,
  userOAuthProviderSchema,
} from './users-request.schemas';
import { ZodValidationPipe } from './zod-validation.pipe';

describe(UsersController.name, () => {
  const policyMetadataKey = 'check_policy';

  function guardsFor(method: keyof UsersController): unknown[] {
    return Reflect.getMetadata(GUARDS_METADATA, UsersController.prototype[method]) ?? [];
  }

  function policiesFor(method: keyof UsersController): unknown[] {
    return Reflect.getMetadata(policyMetadataKey, UsersController.prototype[method]) ?? [];
  }

  it.each(['list', 'get'] satisfies Array<keyof UsersController>)('requires read-user policy for %s', (method) => {
    expect(guardsFor(method)).toEqual(expect.arrayContaining([JwtAuthGuard, PoliciesGuard]));
    expect(policiesFor(method)).toEqual([canReadUsers]);
  });

  it.each(['create', 'update', 'delete', 'resendInvitation', 'revokeInvitation'] satisfies Array<keyof UsersController>)(
    'requires manage-user policy for %s',
    (method) => {
      expect(guardsFor(method)).toEqual(expect.arrayContaining([JwtAuthGuard, PoliciesGuard]));
      expect(policiesFor(method)).toEqual([canManageUsers]);
    },
  );

  it.each(['changePassword', 'completeOAuth', 'completeOAuthState'] satisfies Array<keyof UsersController>)(
    'keeps %s authenticated without admin policy',
    (method) => {
      expect(guardsFor(method)).toEqual([JwtAuthGuard]);
      expect(policiesFor(method)).toEqual([]);
    },
  );

  it.each(['requestPasswordReset', 'resetPassword', 'getInvitation', 'acceptCredentials', 'startOAuth'] satisfies Array<keyof UsersController>)(
    'keeps public flow %s without guards or admin policy',
    (method) => {
      expect(guardsFor(method)).toEqual([]);
      expect(policiesFor(method)).toEqual([]);
    },
  );

  it('normalizes valid create-user payloads', () => {
    const result = new ZodValidationPipe(createUserRequestSchema).transform({
      email: 'ADA@EXAMPLE.COM',
      displayName: 'Ada Lovelace',
      accountStatus: UserAccountStatus.Active,
      roles: [{ name: 'member', permissions: [] }],
      permissions: [],
      sendInvitation: true,
    });

    expect(result.email).toBe('ada@example.com');
  });

  it('rejects invalid create-user account status', () => {
    expect(() =>
      new ZodValidationPipe(createUserRequestSchema).transform({
        email: 'ada@example.com',
        displayName: 'Ada Lovelace',
        accountStatus: 'enabled',
        roles: [],
        permissions: [],
        sendInvitation: true,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects unknown create-user fields', () => {
    expect(() =>
      new ZodValidationPipe(createUserRequestSchema).transform({
        email: 'ada@example.com',
        displayName: 'Ada Lovelace',
        accountStatus: UserAccountStatus.Active,
        roles: [],
        permissions: [],
        sendInvitation: true,
        password: 'should-not-be-here',
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects missing invitation passwords', () => {
    expect(() => new ZodValidationPipe(acceptInvitationCredentialsRequestSchema).transform({ username: 'ada' })).toThrow(BadRequestException);
  });

  it('rejects malformed password reset emails before the service layer', () => {
    expect(() => new ZodValidationPipe(requestUserPasswordResetRequestSchema).transform({ email: 'not-an-email' })).toThrow(BadRequestException);
  });

  it('validates OAuth providers', () => {
    expect(new ZodValidationPipe(userOAuthProviderSchema).transform('google')).toBe(UserOAuthProvider.Google);
    expect(() => new ZodValidationPipe(userOAuthProviderSchema).transform('linkedin')).toThrow(BadRequestException);
  });
});
