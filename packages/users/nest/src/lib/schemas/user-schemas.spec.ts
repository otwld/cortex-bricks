import { UserAccountStatus, UserInvitationStatus, UserOAuthProvider } from '@otwld/ts-users';
import { UserInvitationSchema } from './user-invitation.schema';
import { UserProfileSchema } from './user-profile.schema';

describe('user mongoose schemas', () => {
  it('stores invitation enum fields as constrained strings', () => {
    const statusPath = UserInvitationSchema.path('status') as any;
    const providerPath = UserInvitationSchema.path('oauthStateProvider') as any;

    expect(statusPath.instance).toBe('String');
    expect(statusPath.enumValues).toEqual(expect.arrayContaining(Object.values(UserInvitationStatus)));
    expect(providerPath.instance).toBe('String');
    expect(providerPath.enumValues).toEqual(expect.arrayContaining(Object.values(UserOAuthProvider)));
  });

  it('stores profile enum fields as constrained strings', () => {
    const accountStatusPath = UserProfileSchema.path('accountStatus') as any;
    const invitationStatusPath = UserProfileSchema.path('invitationStatus') as any;

    expect(accountStatusPath.instance).toBe('String');
    expect(accountStatusPath.enumValues).toEqual(expect.arrayContaining(Object.values(UserAccountStatus)));
    expect(invitationStatusPath.instance).toBe('String');
    expect(invitationStatusPath.enumValues).toEqual(expect.arrayContaining(Object.values(UserInvitationStatus)));
  });
});
