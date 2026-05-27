import {
  CreateUserRequest,
  UserAccountStatus,
  UserGender,
  UserInvitationDetails,
  UserInvitationStatus,
  UserListItem,
} from '../index';

describe('ts-users contracts', () => {
  it('models admin-created invited users without an admin password', () => {
    const request: CreateUserRequest = {
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      displayName: 'Ada Lovelace',
      phone: '+15550100',
      bio: 'Computing pioneer',
      avatar: 'https://example.com/ada.png',
      gender: UserGender.Female,
      department: 'Engineering',
      position: 'Principal Engineer',
      employmentType: 'full-time',
      hybridWork: true,
      officeLocation: 'London',
      country: 'GB',
      region: 'London',
      city: 'London',
      postalCode: 'SW1A',
      addressLine1: '1 Example Street',
      addressLine2: 'Suite 10',
      accountStatus: UserAccountStatus.Active,
      roles: [{ name: 'admin', permissions: ['manage:User'] }],
      permissions: ['read:Dashboard'],
      sendInvitation: true,
      internalNotes: 'First admin account',
    };

    expect(request).not.toHaveProperty('password');
    expect(request.email).toBe('ada@example.com');
  });

  it('separates list rows from invitation details', () => {
    const row: UserListItem = {
      id: 'profile-1',
      authUserId: 'auth-1',
      email: 'grace@example.com',
      displayName: 'Grace Hopper',
      firstName: 'Grace',
      lastName: 'Hopper',
      avatar: undefined,
      department: 'Engineering',
      position: 'Admiral',
      accountStatus: UserAccountStatus.Active,
      invitationStatus: UserInvitationStatus.Pending,
      emailVerified: false,
      roles: [{ name: 'member', permissions: [] }],
      permissions: [],
      createdAt: '2026-05-07T00:00:00.000Z',
      updatedAt: '2026-05-07T00:00:00.000Z',
      lastLoginAt: undefined,
    };

    const invitation: UserInvitationDetails = {
      email: row.email,
      displayName: row.displayName,
      status: UserInvitationStatus.Pending,
      expiresAt: '2026-05-08T00:00:00.000Z',
      availableProviders: ['credentials', 'google', 'github'],
    };

    expect(row.invitationStatus).toBe(UserInvitationStatus.Pending);
    expect(invitation.availableProviders).toContain('credentials');
  });
});
