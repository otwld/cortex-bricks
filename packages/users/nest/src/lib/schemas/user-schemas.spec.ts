import { UserAccountStatus, UserInvitationStatus, UserOAuthProvider } from '@otwld/ts-users';
import type { Schema, SchemaType } from 'mongoose';
import { UserInvitationSchema } from './user-invitation.schema';
import { UserProfileSchema } from './user-profile.schema';

type EnumSchemaPath = SchemaType & { enumValues: string[] };

function enumPath(schema: Schema, path: string): EnumSchemaPath {
  const schemaPath = schema.path(path);
  if (!schemaPath || !('enumValues' in schemaPath)) {
    throw new Error(`Expected ${path} to be an enum schema path.`);
  }
  return schemaPath as EnumSchemaPath;
}

describe('user mongoose schemas', () => {
  it('stores invitation enum fields as constrained strings', () => {
    const statusPath = enumPath(UserInvitationSchema, 'status');
    const providerPath = enumPath(UserInvitationSchema, 'oauthStateProvider');

    expect(statusPath.instance).toBe('String');
    expect(statusPath.enumValues).toEqual(expect.arrayContaining(Object.values(UserInvitationStatus)));
    expect(providerPath.instance).toBe('String');
    expect(providerPath.enumValues).toEqual(expect.arrayContaining(Object.values(UserOAuthProvider)));
  });

  it('stores profile enum fields as constrained strings', () => {
    const accountStatusPath = enumPath(UserProfileSchema, 'accountStatus');
    const invitationStatusPath = enumPath(UserProfileSchema, 'invitationStatus');

    expect(accountStatusPath.instance).toBe('String');
    expect(accountStatusPath.enumValues).toEqual(expect.arrayContaining(Object.values(UserAccountStatus)));
    expect(invitationStatusPath.instance).toBe('String');
    expect(invitationStatusPath.enumValues).toEqual(expect.arrayContaining(Object.values(UserInvitationStatus)));
  });
});
