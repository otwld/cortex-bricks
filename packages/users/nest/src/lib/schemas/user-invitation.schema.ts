import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UserInvitationStatus, UserOAuthProvider } from '@otwld/ts-users';
import { HydratedDocument } from 'mongoose';

/** Hydrated invitation document. */
export type UserInvitationDocument = HydratedDocument<UserInvitationRecord>;

/** Invitation token record owned by the users domain. */
@Schema({ timestamps: true })
export class UserInvitationRecord {
  /** Linked profile id. */
  @Prop({ required: true, index: true })
  profileId!: string;

  /** Linked auth account id. */
  @Prop({ required: true, index: true })
  authUserId!: string;

  /** SHA-256 hash of the raw invitation token. */
  @Prop({ required: true, unique: true, index: true })
  tokenHash!: string;

  /** Current invitation state. */
  @Prop({
    type: String,
    enum: Object.values(UserInvitationStatus),
    required: true,
    default: UserInvitationStatus.Pending,
  })
  status!: UserInvitationStatus;

  /** Expiry timestamp. */
  @Prop({ required: true })
  expiresAt!: Date;

  /** Accepted timestamp. */
  @Prop()
  acceptedAt?: Date;

  /** Revoked timestamp. */
  @Prop()
  revokedAt?: Date;

  /** SHA-256 hash of the transient OAuth state for invitation acceptance. */
  @Prop({ index: true })
  oauthStateHash?: string;

  /** OAuth provider selected for the transient state. */
  @Prop({ type: String, enum: Object.values(UserOAuthProvider) })
  oauthStateProvider?: UserOAuthProvider;

  /** Expiry timestamp for the transient OAuth state. */
  @Prop()
  oauthStateExpiresAt?: Date;
}

/** User invitation mongoose schema. */
export const UserInvitationSchema = SchemaFactory.createForClass(UserInvitationRecord);
