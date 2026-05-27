import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UserAccountStatus, UserGender, UserInvitationStatus, UserRole } from '@otwld/ts-users';
import { HydratedDocument } from 'mongoose';

/** Hydrated user profile document. */
export type UserProfileDocument = HydratedDocument<UserProfileRecord>;

/** Business profile linked to an auth account. */
@Schema({ timestamps: true })
export class UserProfileRecord {
  /** Linked auth account id. */
  @Prop({ required: true, index: true, unique: true })
  authUserId!: string;

  /** Email copied from the auth account for list queries. */
  @Prop({ required: true, lowercase: true, index: true })
  email!: string;

  /** Optional local username. */
  @Prop({ lowercase: true, trim: true })
  username?: string;

  /** Optional given name. */
  @Prop()
  firstName?: string;

  /** Optional family name. */
  @Prop()
  lastName?: string;

  /** Display name for dashboard UI. */
  @Prop({ required: true })
  displayName!: string;

  /** Optional biography. */
  @Prop()
  bio?: string;

  /** Optional avatar URL. */
  @Prop()
  avatar?: string;

  /** Optional gender. */
  @Prop({ type: String, enum: Object.values(UserGender) })
  gender?: UserGender;

  /** Optional phone number. */
  @Prop()
  phone?: string;

  /** Optional department label. */
  @Prop()
  department?: string;

  /** Optional position title. */
  @Prop()
  position?: string;

  /** Optional employment type. */
  @Prop()
  employmentType?: string;

  /** Whether the user works hybrid. */
  @Prop()
  hybridWork?: boolean;

  /** Optional office location. */
  @Prop()
  officeLocation?: string;

  /** Optional country code or label. */
  @Prop()
  country?: string;

  /** Optional region or state. */
  @Prop()
  region?: string;

  /** Optional city. */
  @Prop()
  city?: string;

  /** Optional postal code. */
  @Prop()
  postalCode?: string;

  /** Optional address line one. */
  @Prop()
  addressLine1?: string;

  /** Optional address line two. */
  @Prop()
  addressLine2?: string;

  /** Business account status. */
  @Prop({
    type: String,
    enum: Object.values(UserAccountStatus),
    default: UserAccountStatus.Active,
  })
  accountStatus!: UserAccountStatus;

  /** Current invitation status. */
  @Prop({
    type: String,
    enum: Object.values(UserInvitationStatus),
    default: UserInvitationStatus.Pending,
  })
  invitationStatus!: UserInvitationStatus;

  /** Roles copied to the linked auth account. */
  @Prop({ type: [Object], default: [] })
  roles!: UserRole[];

  /** Direct permissions copied to the linked auth account. */
  @Prop({ type: [String], default: [] })
  permissions!: string[];

  /** Optional internal admin note. */
  @Prop()
  internalNotes?: string;

  /** Timestamp for latest invitation. */
  @Prop()
  invitedAt?: Date;

  /** Timestamp for accepted invitation. */
  @Prop()
  invitationAcceptedAt?: Date;
}

/** User profile mongoose schema. */
export const UserProfileSchema = SchemaFactory.createForClass(UserProfileRecord);
