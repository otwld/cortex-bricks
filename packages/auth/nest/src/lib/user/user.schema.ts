import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role, RoleSchema } from './role.schema';

/**
 * Hydrated Mongoose document type for users.
 *
 * @example
 * ```ts
 * const document: UserDocument = await user.save();
 * ```
 */
export type UserDocument = HydratedDocument<User>;

/**
 * Mongoose schema model for local and OAuth user accounts.
 *
 * @example
 * ```ts
 * const user = new User();
 * user.email = 'user@example.com';
 * ```
 */
@Schema({ timestamps: true })
export class User {
  /**
   * Unique lower-cased email address for login and lookup.
   *
   * @example
   * ```ts
   * user.email = 'user@example.com';
   * ```
   */
  @Prop({ required: true, unique: true, lowercase: true, index: true })
  email!: string;

  /**
   * Optional local username selected during invitation acceptance.
   *
   * @example
   * ```ts
   * user.username = 'ada';
   * ```
   */
  @Prop({ unique: true, sparse: true, lowercase: true, trim: true })
  username?: string;

  /**
   * Optional hashed password selected only when explicitly requested.
   *
   * @example
   * ```ts
   * user.password = hashedPassword;
   * ```
   */
  @Prop({ select: false })
  password?: string;

  /**
   * Optional given name displayed on the user profile.
   *
   * @example
   * ```ts
   * user.firstName = 'Ada';
   * ```
   */
  @Prop()
  firstName?: string;

  /**
   * Optional family name displayed on the user profile.
   *
   * @example
   * ```ts
   * user.lastName = 'Lovelace';
   * ```
   */
  @Prop()
  lastName?: string;

  /**
   * Optional profile image URL.
   *
   * @example
   * ```ts
   * user.avatar = 'https://example.com/avatar.png';
   * ```
   */
  @Prop()
  avatar?: string;

  /**
   * Optional Google profile identifier linked to the account.
   *
   * @example
   * ```ts
   * user.googleId = profile.id;
   * ```
   */
  @Prop({ unique: true, sparse: true })
  googleId?: string;

  /**
   * Optional GitHub profile identifier linked to the account.
   *
   * @example
   * ```ts
   * user.githubId = profile.id;
   * ```
   */
  @Prop({ unique: true, sparse: true })
  githubId?: string;

  /**
   * Whether the user's email address has been verified.
   *
   * @example
   * ```ts
   * user.emailVerified = true;
   * ```
   */
  @Prop({ default: false })
  emailVerified!: boolean;

  /**
   * One-time code used by the email verification flow.
   *
   * @example
   * ```ts
   * user.emailVerificationToken = 'A1B2C3';
   * ```
   */
  @Prop()
  emailVerificationToken?: string;

  /**
   * Expiry timestamp for the email verification token.
   *
   * @example
   * ```ts
   * user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
   * ```
   */
  @Prop()
  emailVerificationExpires?: Date;

  /**
   * Hashed reset token used by the password reset flow.
   *
   * @example
   * ```ts
   * user.passwordResetToken = tokenHash;
   * ```
   */
  @Prop()
  passwordResetToken?: string;

  /**
   * Expiry timestamp for the password reset token.
   *
   * @example
   * ```ts
   * user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
   * ```
   */
  @Prop()
  passwordResetExpires?: Date;

  /**
   * Embedded roles assigned to the user.
   *
   * @example
   * ```ts
   * user.roles = [{ name: 'admin', permissions: ['users:read'] }];
   * ```
   */
  @Prop({ type: [RoleSchema], default: [] })
  roles!: Role[];

  /**
   * Direct permission strings assigned to the user.
   *
   * @example
   * ```ts
   * user.permissions = ['billing:read'];
   * ```
   */
  @Prop({ type: [String], default: [] })
  permissions!: string[];

  /**
   * Timestamp for the user's most recent successful login.
   *
   * @example
   * ```ts
   * user.lastLoginAt = new Date();
   * ```
   */
  @Prop()
  lastLoginAt?: Date;
}

/**
 * Mongoose schema generated from the User class.
 *
 * @example
 * ```ts
 * MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]);
 * ```
 */
export const UserSchema = SchemaFactory.createForClass(User);
