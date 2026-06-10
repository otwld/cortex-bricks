import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import {
  AcceptInvitationCredentialsRequest,
  ChangeUserPasswordRequest,
  CompleteInvitationOAuthRequest,
  CreateUserRequest,
  RequestUserPasswordResetRequest,
  ResetUserPasswordRequest,
  UpdateUserRequest,
  UserAccountStatus,
  UserInvitationDeliveryStatus,
  UserInvitationDetails,
  UserInvitationStatus,
  UserOAuthProvider,
  UserProfile,
} from '@otwld/ts-users';
import { ClientSession, Connection } from 'mongoose';
import { AuthAccountRepository } from './auth-account.repository';
import { USERS_MODULE_OPTIONS, UsersModuleOptions } from './config/users-module-options';
import { UserInvitationDocument } from './schemas/user-invitation.schema';
import { UserInvitationRepository } from './user-invitations.repository';
import { UsersRepository } from './users.repository';

type InvitationDocumentLike = Pick<UserInvitationDocument, 'authUserId' | 'expiresAt' | 'status'> & { _id: unknown };
type GeneratedInvitation = { rawToken: string; expiresAt: Date };

/** Business service for dashboard-managed users and invitations. */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  /**
   * Create the users service.
   *
   * @param users - Profile persistence gateway.
   * @param invitations - Invitation token persistence gateway.
   * @param authAccounts - Auth account persistence bridge.
   * @param options - Optional module callbacks and frontend URL settings.
   * @param connection - Optional Mongoose connection used for transactions.
   */
  constructor(
    private readonly users: UsersRepository,
    private readonly invitations: UserInvitationRepository,
    private readonly authAccounts: AuthAccountRepository,
    @Optional() @Inject(USERS_MODULE_OPTIONS) private readonly options: UsersModuleOptions = {},
    @Optional() @InjectConnection() private readonly connection?: Connection,
  ) {}

  /** Lists active dashboard-managed users. */
  async list() {
    const profiles = await this.users.listActive();
    return { users: profiles };
  }

  /** Creates a linked auth account, profile, and optional invitation. */
  async create(dto: CreateUserRequest) {
    const email = dto.email.toLowerCase();
    const existing = await this.authAccounts.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');

    const result = await this.inTransaction(async (session) => {
      const authUser = await this.authAccounts.createPendingAccount(
        {
          email,
          username: dto.username,
          firstName: dto.firstName,
          lastName: dto.lastName,
          avatar: dto.avatar,
          roles: dto.roles,
          permissions: dto.permissions,
        },
        session,
      );

      const profile = await this.users.create(
        {
          ...dto,
          email,
          authUserId: String(authUser._id),
          invitationStatus: dto.sendInvitation ? UserInvitationStatus.Pending : UserInvitationStatus.Revoked,
          invitedAt: dto.sendInvitation ? new Date() : undefined,
        },
        session,
      );

      if (!dto.sendInvitation) return { user: profile, invitation: undefined };

      const invitation = await this.invitations.create(profile.id, profile.authUserId, this.expiryDate(), session);
      return { user: profile, invitation };
    });

    return this.withInvitationResult(result.user, result.invitation);
  }

  /** Gets one safe user profile by profile id. */
  async get(id: string) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return { user };
  }

  /** Updates profile and linked auth account assignment fields. */
  async update(id: string, dto: UpdateUserRequest) {
    const current = await this.users.findById(id);
    if (!current) throw new NotFoundException('User not found');
    return this.inTransaction(async (session) => {
      const user = await this.users.updateById(id, dto, session);
      if (!user) throw new NotFoundException('User not found');
      await this.authAccounts.updateAssignments(current.authUserId, this.authMirrorUpdate(dto), session);
      return { user };
    });
  }

  /**
   * Soft deletes a profile and disables the linked auth account.
   *
   * @param id - User profile identifier to delete.
   * @returns The deleted profile DTO.
   * @throws NotFoundException When the profile cannot be found.
   */
  async softDelete(id: string) {
    return this.inTransaction(async (session) => {
      const user = await this.users.softDelete(id, session);
      if (!user) throw new NotFoundException('User not found');
      await this.authAccounts.disableAccount(user.authUserId, session);
      return { user };
    });
  }

  /** Resends an invitation for an existing user profile. */
  async resendInvitation(id: string) {
    const result = await this.inTransaction(async (session) => {
      const user = await this.users.findById(id);
      if (!user) throw new NotFoundException('User not found');
      const invitation = await this.invitations.create(user.id, user.authUserId, this.expiryDate(), session);
      const updated = await this.users.updateById(
        id,
        {
          invitationStatus: UserInvitationStatus.Pending,
          invitedAt: new Date(),
        },
        session,
      );
      if (!updated) throw new NotFoundException('User not found');
      return { user: updated, invitation };
    });

    return this.withInvitationResult(result.user, result.invitation);
  }

  /** Reads safe invitation details by raw token. */
  async getInvitation(rawToken: string): Promise<{ invitation: UserInvitationDetails }> {
    const invitation = await this.invitations.findByRawToken(rawToken);
    if (!invitation) throw new NotFoundException('Invitation not found');
    const profile = await this.users.findByAuthUserId(invitation.authUserId);
    if (!profile) throw new NotFoundException('User not found');
    const status = this.statusForInvitation(invitation.status, invitation.expiresAt);
    return {
      invitation: {
        email: profile.email,
        displayName: profile.displayName,
        status,
        expiresAt: invitation.expiresAt.toISOString(),
        availableProviders: ['credentials', 'google', 'github'],
      },
    };
  }

  /** Accepts an invitation with local credentials. */
  async acceptCredentials(rawToken: string, dto: AcceptInvitationCredentialsRequest) {
    const invitation = await this.requirePendingInvitation(rawToken);
    await this.authAccounts.setLocalCredentials(invitation.authUserId, dto.password, dto.username);
    await this.invitations.accept(String(invitation._id));
    const user = await this.users.updateByAuthUserId(invitation.authUserId, {
      username: dto.username,
      invitationStatus: UserInvitationStatus.Accepted,
      invitationAcceptedAt: new Date(),
      accountStatus: UserAccountStatus.Active,
    });
    if (!user) throw new NotFoundException('User not found');
    return { accepted: true, user };
  }

  /** Marks an OAuth invitation accepted after the current auth session matches the invitation. */
  async completeOAuth(rawToken: string, authUserId: string) {
    const invitation = await this.requirePendingInvitation(rawToken);
    if (invitation.authUserId !== authUserId) throw new BadRequestException('Invitation does not match current user');
    await this.invitations.accept(String(invitation._id));
    const user = await this.users.updateByAuthUserId(authUserId, {
      invitationStatus: UserInvitationStatus.Accepted,
      invitationAcceptedAt: new Date(),
      accountStatus: UserAccountStatus.Active,
    });
    if (!user) throw new NotFoundException('User not found');
    return { accepted: true, user };
  }

  /** Marks an OAuth invitation accepted using a single-use OAuth state. */
  async completeOAuthState(dto: CompleteInvitationOAuthRequest, authUserId: string) {
    const invitation = await this.invitations.findByOAuthState(dto.state);
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== UserInvitationStatus.Pending || invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation is not active');
    }
    if (invitation.authUserId !== authUserId) throw new BadRequestException('Invitation does not match current user');
    await this.invitations.clearOAuthState(String(invitation._id));
    await this.invitations.accept(String(invitation._id));
    const user = await this.users.updateByAuthUserId(authUserId, {
      invitationStatus: UserInvitationStatus.Accepted,
      invitationAcceptedAt: new Date(),
      accountStatus: UserAccountStatus.Active,
    });
    if (!user) throw new NotFoundException('User not found');
    return { accepted: true, user };
  }

  /** Creates a transient OAuth state and returns the auth provider route. */
  async startOAuth(rawToken: string, provider: UserOAuthProvider) {
    if (!Object.values(UserOAuthProvider).includes(provider)) throw new BadRequestException('Unsupported OAuth provider');
    await this.requirePendingInvitation(rawToken);
    const state = await this.invitations.createOAuthState(rawToken, provider, this.oauthStateExpiryDate());
    return { redirectPath: `/api/auth/${provider}?state=${encodeURIComponent(state)}` };
  }

  /** Revokes an invitation. */
  async revokeInvitation(rawToken: string) {
    const invitation = await this.invitations.revokeByRawToken(rawToken);
    if (!invitation) throw new NotFoundException('Invitation not found');
    await this.users.updateByAuthUserId(invitation.authUserId, { invitationStatus: UserInvitationStatus.Revoked });
    return { revoked: true };
  }

  /** Changes the current user's password after checking the current password. */
  async changePassword(authUserId: string, dto: ChangeUserPasswordRequest) {
    await this.authAccounts.changePassword(authUserId, dto.currentPassword, dto.newPassword);
    return { changed: true };
  }

  /** Requests a password reset without exposing whether the account exists. */
  async requestPasswordReset(dto: RequestUserPasswordResetRequest) {
    const reset = await this.authAccounts.requestPasswordReset(dto.email);
    if (reset) {
      await this.runMailCallback('onPasswordResetRequested', () => this.options.mail?.onPasswordResetRequested?.({
        email: reset.user.email,
        name: reset.user.firstName ?? reset.user.email,
        resetToken: reset.rawToken,
        expiresAt: reset.expiresAt,
      }));
    }
    return { requested: true };
  }

  /** Resets a password using a raw reset token. */
  async resetPassword(dto: ResetUserPasswordRequest) {
    const user = await this.authAccounts.resetPassword(dto.token, dto.password);
    await this.runMailCallback('onPasswordReset', () => this.options.mail?.onPasswordReset?.({
      email: user.email,
      name: user.firstName ?? user.email,
    }));
    return { reset: true };
  }

  private expiryDate(): Date {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  private oauthStateExpiryDate(): Date {
    return new Date(Date.now() + 10 * 60 * 1000);
  }

  private async inTransaction<T>(work: (session?: ClientSession) => Promise<T>): Promise<T> {
    if (!this.connection) return work(undefined);

    const session = await this.connection.startSession();
    try {
      let result!: T;
      await session.withTransaction(async () => {
        result = await work(session);
      });
      return result;
    } finally {
      await session.endSession();
    }
  }

  private invitationLink(rawToken: string): string {
    const path = `/accept-invitation/${encodeURIComponent(rawToken)}`;
    const baseUrl = this.options.frontendUrl?.replace(/\/$/, '');
    return baseUrl ? `${baseUrl}${path}` : path;
  }

  private async withInvitationResult(user: UserProfile, invitation?: GeneratedInvitation) {
    if (!invitation) return { user, invitationSent: false };

    const link = this.invitationLink(invitation.rawToken);
    const deliveryStatus = await this.deliverInvitation(user, link, invitation.expiresAt);
    return {
      user,
      invitation: {
        link,
        expiresAt: invitation.expiresAt.toISOString(),
        deliveryStatus,
      },
      invitationSent: deliveryStatus === 'sent',
      invitationLink: link,
      invitationExpiresAt: invitation.expiresAt.toISOString(),
    };
  }

  private async deliverInvitation(user: UserProfile, invitationUrl: string, expiresAt: Date): Promise<UserInvitationDeliveryStatus> {
    const callback = this.options.mail?.onInvitationCreated;
    if (!callback) return 'not-requested';

    try {
      await callback({
        email: user.email,
        name: user.displayName || user.email,
        invitationUrl,
        expiresAt,
      });
      return 'sent';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Users mail callback onInvitationCreated failed: ${message}`);
      return 'failed';
    }
  }

  private statusForInvitation(status: UserInvitationStatus, expiresAt: Date): UserInvitationStatus {
    if (status === UserInvitationStatus.Pending && expiresAt < new Date()) return UserInvitationStatus.Expired;
    return status;
  }

  private async requirePendingInvitation(rawToken: string): Promise<InvitationDocumentLike> {
    const invitation = await this.invitations.findByRawToken(rawToken);
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== UserInvitationStatus.Pending || invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation is not active');
    }
    return invitation;
  }

  private authMirrorUpdate(dto: UpdateUserRequest) {
    return Object.fromEntries(
      Object.entries({
        email: dto.email?.toLowerCase(),
        username: dto.username,
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatar: dto.avatar,
        roles: dto.roles,
        permissions: dto.permissions,
      }).filter(([, value]) => value !== undefined),
    );
  }

  private async runMailCallback(name: string, callback: () => Promise<void> | undefined): Promise<void> {
    try {
      await callback();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Users mail callback ${name} failed: ${message}`);
    }
  }
}
