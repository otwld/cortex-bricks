import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  UserAccountStatus,
  UserInvitationStatus,
  UserOAuthProvider,
} from '@otwld/ts-users';
import { UsersService } from './users.service';

describe(UsersService.name, () => {
  const profile = {
    id: 'profile-1',
    authUserId: 'auth-1',
    email: 'ada@example.com',
    displayName: 'Ada Lovelace',
    accountStatus: UserAccountStatus.Active,
    invitationStatus: UserInvitationStatus.Pending,
    roles: [{ name: 'admin', permissions: ['manage:User'] }],
    permissions: [],
    createdAt: '2026-05-07T00:00:00.000Z',
    updatedAt: '2026-05-07T00:00:00.000Z',
    emailVerified: false,
  };

  function createConnection() {
    const session = {
      withTransaction: vi.fn(async (callback: () => Promise<void>) =>
        callback(),
      ),
      endSession: vi.fn().mockResolvedValue(undefined),
    };
    const connection = {
      startSession: vi.fn().mockResolvedValue(session),
    };
    return { connection, session };
  }

  function createService(options?: unknown, connection?: unknown) {
    const users = {
      listActive: vi.fn().mockResolvedValue([profile]),
      create: vi.fn().mockResolvedValue(profile),
      findById: vi.fn().mockResolvedValue(profile),
      findByAuthUserId: vi.fn().mockResolvedValue(profile),
      updateById: vi.fn().mockResolvedValue(profile),
      updateByAuthUserId: vi
        .fn()
        .mockResolvedValue({
          ...profile,
          invitationStatus: UserInvitationStatus.Accepted,
        }),
      softDelete: vi
        .fn()
        .mockResolvedValue({
          ...profile,
          accountStatus: UserAccountStatus.Deleted,
        }),
    };
    const invitations = {
      create: vi
        .fn()
        .mockResolvedValue({
          rawToken: 'raw-token',
          expiresAt: new Date('2026-05-14T00:00:00.000Z'),
        }),
      createOAuthState: vi.fn().mockResolvedValue('oauth-state'),
      findByRawToken: vi.fn().mockResolvedValue({
        _id: 'invitation-1',
        authUserId: 'auth-1',
        profileId: 'profile-1',
        status: UserInvitationStatus.Pending,
        expiresAt: new Date(Date.now() + 60_000),
      }),
      findByOAuthState: vi.fn().mockResolvedValue({
        _id: 'invitation-1',
        authUserId: 'auth-1',
        profileId: 'profile-1',
        status: UserInvitationStatus.Pending,
        expiresAt: new Date(Date.now() + 60_000),
      }),
      clearOAuthState: vi.fn().mockResolvedValue(undefined),
      accept: vi.fn().mockResolvedValue(undefined),
      revokeByRawToken: vi.fn().mockResolvedValue({ authUserId: 'auth-1' }),
    };
    const authAccounts = {
      findByEmail: vi.fn().mockResolvedValue(null),
      createPendingAccount: vi.fn().mockResolvedValue({ _id: 'auth-1' }),
      updateAssignments: vi.fn().mockResolvedValue(undefined),
      setLocalCredentials: vi.fn().mockResolvedValue(undefined),
      changePassword: vi.fn().mockResolvedValue(undefined),
      disableAccount: vi.fn().mockResolvedValue(undefined),
      requestPasswordReset: vi.fn().mockResolvedValue({
        rawToken: 'reset-token',
        expiresAt: new Date('2026-05-07T01:00:00.000Z'),
        user: { email: 'ada@example.com', firstName: 'Ada' },
      }),
      resetPassword: vi
        .fn()
        .mockResolvedValue({ email: 'ada@example.com', firstName: 'Ada' }),
    };
    const service = new (UsersService as any)(
      users,
      invitations,
      authAccounts,
      options,
      connection,
    ) as UsersService;
    return { service, users, invitations, authAccounts };
  }

  it('creates a linked auth account, profile, and invitation link', async () => {
    const { service, users, invitations, authAccounts } = createService();

    const result = await service.create({
      email: 'ada@example.com',
      displayName: 'Ada Lovelace',
      accountStatus: UserAccountStatus.Active,
      roles: [{ name: 'admin', permissions: ['manage:User'] }],
      permissions: [],
      sendInvitation: true,
    });

    expect(authAccounts.createPendingAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ada@example.com',
        roles: [{ name: 'admin', permissions: ['manage:User'] }],
      }),
      undefined,
    );
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        authUserId: 'auth-1',
        invitationStatus: UserInvitationStatus.Pending,
      }),
      undefined,
    );
    expect(invitations.create).toHaveBeenCalledWith(
      'profile-1',
      'auth-1',
      expect.any(Date),
      undefined,
    );
    expect(result).toEqual(
      expect.objectContaining({
        invitationSent: false,
        invitationLink: '/accept-invitation/raw-token',
        invitation: expect.objectContaining({
          link: '/accept-invitation/raw-token',
          deliveryStatus: 'not-requested',
        }),
      }),
    );
  });

  it('sends invitation email when a callback is configured', async () => {
    const onInvitationCreated = vi.fn().mockResolvedValue(undefined);
    const { service } = createService({ mail: { onInvitationCreated } });

    const result = await service.create({
      email: 'ada@example.com',
      displayName: 'Ada Lovelace',
      accountStatus: UserAccountStatus.Active,
      roles: [],
      permissions: [],
      sendInvitation: true,
    });

    expect(onInvitationCreated).toHaveBeenCalledWith({
      email: 'ada@example.com',
      name: 'Ada Lovelace',
      invitationUrl: '/accept-invitation/raw-token',
      expiresAt: new Date('2026-05-14T00:00:00.000Z'),
    });
    expect(result).toEqual(
      expect.objectContaining({
        invitationSent: true,
        invitation: expect.objectContaining({ deliveryStatus: 'sent' }),
      }),
    );
  });

  it('returns a manual invitation link when invitation email delivery fails', async () => {
    const onInvitationCreated = vi
      .fn()
      .mockRejectedValue(new Error('postal unavailable'));
    const { service } = createService({ mail: { onInvitationCreated } });

    const result = await service.create({
      email: 'ada@example.com',
      displayName: 'Ada Lovelace',
      accountStatus: UserAccountStatus.Active,
      roles: [],
      permissions: [],
      sendInvitation: true,
    });

    expect(result).toEqual(
      expect.objectContaining({
        invitationSent: false,
        invitationLink: '/accept-invitation/raw-token',
        invitation: expect.objectContaining({ deliveryStatus: 'failed' }),
      }),
    );
  });

  it('rejects duplicate auth emails', async () => {
    const { service, authAccounts } = createService();
    authAccounts.findByEmail.mockResolvedValue({ _id: 'auth-existing' });

    await expect(
      service.create({
        email: 'ada@example.com',
        displayName: 'Ada Lovelace',
        accountStatus: UserAccountStatus.Active,
        roles: [],
        permissions: [],
        sendInvitation: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists profiles', async () => {
    const { service } = createService();

    await expect(service.list()).resolves.toEqual({ users: [profile] });
  });

  it('loads profile details', async () => {
    const { service } = createService();

    await expect(service.get('profile-1')).resolves.toEqual({ user: profile });
  });

  it('throws when profile details are missing', async () => {
    const { service, users } = createService();
    users.findById.mockResolvedValue(null);

    await expect(service.get('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates profile and auth assignment fields', async () => {
    const { service, users, authAccounts } = createService();

    await service.update('profile-1', {
      displayName: 'Ada Byron',
      roles: [],
      permissions: [],
    });

    expect(users.updateById).toHaveBeenCalledWith(
      'profile-1',
      { displayName: 'Ada Byron', roles: [], permissions: [] },
      undefined,
    );
    expect(authAccounts.updateAssignments).toHaveBeenCalledWith(
      'auth-1',
      expect.objectContaining({ roles: [], permissions: [] }),
      undefined,
    );
  });

  it('creates auth, profile, and invitation inside a transaction when a connection is available', async () => {
    const { connection, session } = createConnection();
    const { service, users, invitations, authAccounts } = createService(
      undefined,
      connection,
    );

    await service.create({
      email: 'ada@example.com',
      displayName: 'Ada Lovelace',
      accountStatus: UserAccountStatus.Active,
      roles: [],
      permissions: [],
      sendInvitation: true,
    });

    expect(connection.startSession).toHaveBeenCalled();
    expect(session.withTransaction).toHaveBeenCalled();
    expect(authAccounts.createPendingAccount).toHaveBeenCalledWith(
      expect.any(Object),
      session,
    );
    expect(users.create).toHaveBeenCalledWith(expect.any(Object), session);
    expect(invitations.create).toHaveBeenCalledWith(
      'profile-1',
      'auth-1',
      expect.any(Date),
      session,
    );
    expect(session.endSession).toHaveBeenCalled();
  });

  it('does not create an invitation when profile creation fails inside a transaction', async () => {
    const { connection, session } = createConnection();
    const { service, users, invitations } = createService(
      undefined,
      connection,
    );
    users.create.mockRejectedValue(new Error('profile write failed'));

    await expect(
      service.create({
        email: 'ada@example.com',
        displayName: 'Ada Lovelace',
        accountStatus: UserAccountStatus.Active,
        roles: [],
        permissions: [],
        sendInvitation: true,
      }),
    ).rejects.toThrow('profile write failed');

    expect(session.withTransaction).toHaveBeenCalled();
    expect(invitations.create).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
  });

  it('rejects updates when auth assignment persistence fails inside a transaction', async () => {
    const { connection, session } = createConnection();
    const { service, users, authAccounts } = createService(
      undefined,
      connection,
    );
    authAccounts.updateAssignments.mockRejectedValue(
      new Error('auth update failed'),
    );

    await expect(
      service.update('profile-1', {
        displayName: 'Ada Byron',
        roles: [],
        permissions: [],
      }),
    ).rejects.toThrow('auth update failed');

    expect(users.updateById).toHaveBeenCalledWith(
      'profile-1',
      { displayName: 'Ada Byron', roles: [], permissions: [] },
      session,
    );
    expect(authAccounts.updateAssignments).toHaveBeenCalledWith(
      'auth-1',
      expect.objectContaining({ roles: [], permissions: [] }),
      session,
    );
    expect(session.endSession).toHaveBeenCalled();
  });

  it('soft deletes profiles', async () => {
    const { service } = createService();

    await expect(service.softDelete('profile-1')).resolves.toEqual({
      user: expect.objectContaining({
        accountStatus: UserAccountStatus.Deleted,
      }),
    });
  });

  it('soft deletes profile and disables linked auth account in one transaction', async () => {
    const { connection, session } = createConnection();
    const { service, users, authAccounts } = createService(
      undefined,
      connection,
    );

    await expect(service.softDelete('profile-1')).resolves.toEqual({
      user: expect.objectContaining({
        accountStatus: UserAccountStatus.Deleted,
      }),
    });

    expect(users.softDelete).toHaveBeenCalledWith('profile-1', session);
    expect(authAccounts.disableAccount).toHaveBeenCalledWith('auth-1', session);
    expect(session.withTransaction).toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
  });

  it('resends invitations with a fresh link', async () => {
    const { service, invitations, users } = createService();

    await expect(service.resendInvitation('profile-1')).resolves.toEqual(
      expect.objectContaining({
        invitationSent: false,
        invitationLink: '/accept-invitation/raw-token',
        invitation: expect.objectContaining({
          deliveryStatus: 'not-requested',
        }),
      }),
    );

    expect(invitations.create).toHaveBeenCalledWith(
      'profile-1',
      'auth-1',
      expect.any(Date),
      undefined,
    );
    expect(users.updateById).toHaveBeenCalledWith(
      'profile-1',
      expect.objectContaining({
        invitationStatus: UserInvitationStatus.Pending,
      }),
      undefined,
    );
  });

  it('returns safe invitation details with credentials and social options', async () => {
    const { service } = createService();

    await expect(service.getInvitation('raw-token')).resolves.toEqual({
      invitation: expect.objectContaining({
        email: 'ada@example.com',
        availableProviders: ['credentials', 'google', 'github'],
      }),
    });
  });

  it('accepts credentials for active invitations', async () => {
    const { service, authAccounts, invitations, users } = createService();

    await service.acceptCredentials('raw-token', {
      username: 'ada',
      password: 'secret123',
    });

    expect(authAccounts.setLocalCredentials).toHaveBeenCalledWith(
      'auth-1',
      'secret123',
      'ada',
    );
    expect(invitations.accept).toHaveBeenCalledWith('invitation-1');
    expect(users.updateByAuthUserId).toHaveBeenCalledWith(
      'auth-1',
      expect.objectContaining({
        invitationStatus: UserInvitationStatus.Accepted,
      }),
    );
  });

  it('starts invitation OAuth for supported providers', async () => {
    const { service, invitations } = createService();

    await expect(
      service.startOAuth('raw-token', UserOAuthProvider.Google),
    ).resolves.toEqual({ redirectPath: '/api/auth/google?state=oauth-state' });
    expect(invitations.createOAuthState).toHaveBeenCalledWith(
      'raw-token',
      UserOAuthProvider.Google,
      expect.any(Date),
    );
  });

  it('rejects OAuth completion for a different auth account', async () => {
    const { service } = createService();

    await expect(
      service.completeOAuth('raw-token', 'other-auth'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('completes OAuth invitations with a single-use state', async () => {
    const { service, invitations, users } = createService();

    await expect(
      service.completeOAuthState({ state: 'oauth-state' }, 'auth-1'),
    ).resolves.toEqual({
      accepted: true,
      user: expect.objectContaining({
        invitationStatus: UserInvitationStatus.Accepted,
      }),
    });

    expect(invitations.findByOAuthState).toHaveBeenCalledWith('oauth-state');
    expect(invitations.clearOAuthState).toHaveBeenCalledWith('invitation-1');
    expect(invitations.accept).toHaveBeenCalledWith('invitation-1');
    expect(users.updateByAuthUserId).toHaveBeenCalledWith(
      'auth-1',
      expect.objectContaining({
        invitationStatus: UserInvitationStatus.Accepted,
      }),
    );
  });

  it('changes the current user password through the auth account bridge', async () => {
    const { service, authAccounts } = createService();

    await expect(
      service.changePassword('auth-1', {
        currentPassword: 'old-password',
        newPassword: 'new-password',
      }),
    ).resolves.toEqual({ changed: true });

    expect(authAccounts.changePassword).toHaveBeenCalledWith(
      'auth-1',
      'old-password',
      'new-password',
    );
  });

  it('rejects password changes with invalid current credentials', async () => {
    const { service, authAccounts } = createService();
    authAccounts.changePassword.mockRejectedValue(
      new UnauthorizedException('Current password is invalid'),
    );

    await expect(
      service.changePassword('auth-1', {
        currentPassword: 'bad-password',
        newPassword: 'new-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('requests password reset without exposing account existence', async () => {
    const { service, authAccounts } = createService();

    await expect(
      service.requestPasswordReset({ email: 'ada@example.com' }),
    ).resolves.toEqual({ requested: true });

    expect(authAccounts.requestPasswordReset).toHaveBeenCalledWith(
      'ada@example.com',
    );
  });

  it('returns a generic password reset response for unknown emails', async () => {
    const onPasswordResetRequested = vi.fn().mockResolvedValue(undefined);
    const { service, authAccounts } = createService({
      mail: { onPasswordResetRequested },
    });
    authAccounts.requestPasswordReset.mockResolvedValue(undefined);

    await expect(
      service.requestPasswordReset({ email: 'missing@example.com' }),
    ).resolves.toEqual({ requested: true });

    expect(onPasswordResetRequested).not.toHaveBeenCalled();
  });

  it('notifies configured mail callback when a password reset token is generated', async () => {
    const onPasswordResetRequested = vi.fn().mockResolvedValue(undefined);
    const { service } = createService({ mail: { onPasswordResetRequested } });

    await service.requestPasswordReset({ email: 'ada@example.com' });

    expect(onPasswordResetRequested).toHaveBeenCalledWith({
      email: 'ada@example.com',
      name: 'Ada',
      resetToken: 'reset-token',
      expiresAt: new Date('2026-05-07T01:00:00.000Z'),
    });
  });

  it('resets password with a valid reset token', async () => {
    const { service, authAccounts } = createService();

    await expect(
      service.resetPassword({ token: 'reset-token', password: 'new-password' }),
    ).resolves.toEqual({ reset: true });

    expect(authAccounts.resetPassword).toHaveBeenCalledWith(
      'reset-token',
      'new-password',
    );
  });

  it('notifies configured mail callback after a password reset succeeds', async () => {
    const onPasswordReset = vi.fn().mockResolvedValue(undefined);
    const { service } = createService({ mail: { onPasswordReset } });

    await service.resetPassword({
      token: 'reset-token',
      password: 'new-password',
    });

    expect(onPasswordReset).toHaveBeenCalledWith({
      email: 'ada@example.com',
      name: 'Ada',
    });
  });
});
