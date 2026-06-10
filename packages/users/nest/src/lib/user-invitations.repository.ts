import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserInvitationStatus, UserOAuthProvider } from '@otwld/ts-users';
import { createHash, randomBytes } from 'crypto';
import { ClientSession, Model } from 'mongoose';
import { UserInvitationDocument, UserInvitationRecord } from './schemas/user-invitation.schema';

/** Persistence gateway for user invitation tokens. */
@Injectable()
export class UserInvitationRepository {
  /** Create the invitation repository. */
  constructor(@InjectModel(UserInvitationRecord.name) private readonly invitationModel: Model<UserInvitationDocument>) {}

  /** Generates a raw invitation token. */
  generateRawToken(): string {
    return randomBytes(32).toString('hex');
  }

  /** Hashes a raw invitation token for storage. */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Creates a pending invitation and returns the raw token. */
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
  findByRawToken(rawToken: string) {
    return this.invitationModel.findOne({ tokenHash: this.hashToken(rawToken) }).exec();
  }

  /** Finds an invitation by a raw OAuth state. */
  findByOAuthState(rawState: string) {
    return this.invitationModel
      .findOne({ oauthStateHash: this.hashToken(rawState), oauthStateExpiresAt: { $gt: new Date() } })
      .exec();
  }

  /** Clears a transient OAuth state after it has been consumed. */
  clearOAuthState(id: string) {
    return this.invitationModel
      .findByIdAndUpdate(id, { $unset: { oauthStateHash: '', oauthStateProvider: '', oauthStateExpiresAt: '' } }, { new: true })
      .exec();
  }

  /** Accepts an invitation. */
  accept(id: string) {
    return this.invitationModel.findByIdAndUpdate(id, { status: UserInvitationStatus.Accepted, acceptedAt: new Date() }, { new: true }).exec();
  }

  /** Revokes an invitation. */
  revokeByRawToken(rawToken: string) {
    return this.invitationModel
      .findOneAndUpdate({ tokenHash: this.hashToken(rawToken) }, { status: UserInvitationStatus.Revoked, revokedAt: new Date() }, { new: true })
      .exec();
  }
}
