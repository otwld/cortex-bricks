import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

/**
 * Hydrated Mongoose document type for refresh tokens.
 *
 * @example
 * ```ts
 * const document: RefreshTokenDocument = await token.save();
 * ```
 */
export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

/**
 * Mongoose schema model storing hashed refresh tokens and revocation state.
 *
 * @example
 * ```ts
 * const refreshToken = new RefreshToken();
 * refreshToken.tokenHash = tokenHash;
 * ```
 */
@Schema({ timestamps: true })
export class RefreshToken {
  /**
   * AuthAccount document that owns the refresh token.
   *
   * @example
   * ```ts
   * refreshToken.userId = new mongoose.Types.ObjectId(userId);
   * ```
   */
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'AuthAccount' })
  userId!: mongoose.Types.ObjectId;

  /**
   * SHA-256 hash of the raw refresh token.
   *
   * @example
   * ```ts
   * refreshToken.tokenHash = tokenHash;
   * ```
   */
  @Prop({ required: true })
  tokenHash!: string;

  /**
   * Whether the token has been revoked or rotated.
   *
   * @example
   * ```ts
   * refreshToken.revoked = true;
   * ```
   */
  @Prop({ default: false })
  revoked!: boolean;

  /**
   * Optional user-agent captured when the token was issued.
   *
   * @example
   * ```ts
   * refreshToken.userAgent = request.headers['user-agent'];
   * ```
   */
  @Prop()
  userAgent?: string;

  /**
   * Optional source IP captured when the token was issued.
   *
   * @example
   * ```ts
   * refreshToken.ip = request.ip;
   * ```
   */
  @Prop()
  ip?: string;

  /**
   * Expiration timestamp used by MongoDB's TTL index.
   *
   * @example
   * ```ts
   * refreshToken.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
   * ```
   */
  @Prop({ required: true, index: { expires: 0 } })
  expiresAt!: Date;
}

/**
 * Mongoose schema generated from the RefreshToken class.
 *
 * @example
 * ```ts
 * MongooseModule.forFeature([{ name: RefreshToken.name, schema: RefreshTokenSchema }]);
 * ```
 */
export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
