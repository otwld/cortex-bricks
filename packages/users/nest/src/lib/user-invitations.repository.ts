import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserInvitationStatus, UserOAuthProvider } from '@otwld/ts-users';
import { createHash, randomBytes } from 'crypto';
import { ClientSession, Model } from 'mongoose';
import { UserInvitationDocument, UserInvitationRecord } from './schemas/user-invitation.schema';

/** Persistence gateway for user invitation tokens. */
@Injectable()
export class UserInvitationRepository {
  /** Creates the invitation repository. */
  /**
   * Creates a user invitation repository instance.
   *
   * @param invitationModel - invitation model value.
   */
  constructor(@InjectModel(UserInvitationRecord.name) private readonly invitationModel: Model<UserInvitationDocument>) {}

  /** Generates a raw invitation token. */
  /**
   * Runs generate raw token.
   *
   * @returns The user invitation repository generate raw token result.
   */
  generateRawToken(): string {
    return randomBytes(32).toString('hex');
  }

  /** Hashes a raw invitation token for storage. */
  /**
   * Runs hash token.
   *
   * @param token - token value.
   *
   * @returns The user invitation repository hash token result.
   */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Creates a pending invitation and returns the raw token. */
  /**
   * Runs create.
   *
   * @param profileId - profile id value.
   *
   * @param authUserId - auth user id value.
   *
   * @param expiresAt - expires at value.
   *
   * @param session - session value.
   *
   * @returns The user invitation repository create result.
   */
  async create(profileId: string, authUserId: string, expiresAt: Date, session?: ClientSession): Promise<{ rawToken: string; expiresAt: Date }> {
    const rawToken = this.generateRawToken();
    await new this.invitationModel({
      profileId,
      authUserId,
      tokenHash: this.hashToken(rawToken),
      status: UserInvitationStatus.Pending,
      expiresAt,
    }).save({ session });
    return { rawToken, expiresAt };
  }

  /** Creates a single-use OAuth state for a pending invitation. */
  /**
   * Runs create oauth state.
   *
   * @param rawToken - raw token value.
   *
   * @param provider - provider value.
   *
   * @param expiresAt - expires at value.
   *
   * @returns The user invitation repository create oauth state result.
   */
  async createOAuthState(rawToken: string, provider: UserOAuthProvider, expiresAt: Date): Promise<string> {
    const rawState = randomBytes(32).toString('base64url');
    await this.invitationModel
      .findOneAndUpdate(
        { tokenHash: this.hashToken(rawToken) },
        {
          oauthStateHash: this.hashToken(rawState),
          oauthStateProvider: provider,
          oauthStateExpiresAt: expiresAt,
        },
        { new: true },
      )
      .exec();
    return rawState;
  }

  /** Finds a valid invitation by raw token. */
  /**
   * Runs find by raw token.
   *
   * @param rawToken - raw token value.
   *
   * @returns The user invitation repository find by raw token result.
   */
  findByRawToken(rawToken: string) {
    return this.invitationModel.findOne({ tokenHash: this.hashToken(rawToken) }).exec();
  }

  /** Finds an invitation by a raw OAuth state. */
  /**
   * Runs find by oauth state.
   *
   * @param rawState - raw state value.
   *
   * @returns The user invitation repository find by oauth state result.
   */
  findByOAuthState(rawState: string) {
    return this.invitationModel
      .findOne({ oauthStateHash: this.hashToken(rawState), oauthStateExpiresAt: { $gt: new Date() } })
      .exec();
  }

  /** Clears a transient OAuth state after it has been consumed. */
  /**
   * Runs clear oauth state.
   *
   * @param id - id value.
   *
   * @returns The user invitation repository clear oauth state result.
   */
  clearOAuthState(id: string) {
    return this.invitationModel
      .findByIdAndUpdate(id, { $unset: { oauthStateHash: '', oauthStateProvider: '', oauthStateExpiresAt: '' } }, { new: true })
      .exec();
  }

  /** Accepts an invitation. */
  /**
   * Runs accept.
   *
   * @param id - id value.
   *
   * @returns The user invitation repository accept result.
   */
  accept(id: string) {
    return this.invitationModel.findByIdAndUpdate(id, { status: UserInvitationStatus.Accepted, acceptedAt: new Date() }, { new: true }).exec();
  }

  /** Revokes an invitation. */
  /**
   * Runs revoke by raw token.
   *
   * @param rawToken - raw token value.
   *
   * @returns The user invitation repository revoke by raw token result.
   */
  revokeByRawToken(rawToken: string) {
    return this.invitationModel
      .findOneAndUpdate({ tokenHash: this.hashToken(rawToken) }, { status: UserInvitationStatus.Revoked, revokedAt: new Date() }, { new: true })
      .exec();
  }
}
