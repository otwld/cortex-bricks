import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefreshToken, RefreshTokenDocument } from './refresh-token.schema';

/**
 * Persistence gateway for refresh token documents.
 *
 * @example
 * ```ts
 * const token = await repository.findByHash(tokenHash);
 * ```
 */
@Injectable()
export class RefreshTokenRepository {
  /**
   * Creates a refresh token repository backed by the Mongoose model.
   *
   * @param model - Mongoose model for refresh token documents.
   * @example
   * ```ts
   * const repository = new RefreshTokenRepository(refreshTokenModel);
   * ```
   */
  constructor(@InjectModel(RefreshToken.name) private readonly model: Model<RefreshTokenDocument>) {}

  /**
   * Persists a refresh token hash and request metadata.
   *
   * @param userId - Identifier for the user that owns the token.
   * @param tokenHash - SHA-256 hash of the raw refresh token.
   * @param expiresAt - Expiration date used by the token TTL index.
   * @param userAgent - Optional user-agent captured when the token was issued.
   * @param ip - Optional source IP captured when the token was issued.
   * @returns The saved refresh token document.
   * @example
   * ```ts
   * await repository.create(userId, tokenHash, expiresAt, request.headers['user-agent'], request.ip);
   * ```
   */
  create(userId: string, tokenHash: string, expiresAt: Date, userAgent?: string, ip?: string) {
    return new this.model({ userId, tokenHash, expiresAt, userAgent, ip }).save();
  }

  /**
   * Finds a refresh token by its stored hash.
   *
   * @param tokenHash - SHA-256 hash of the raw refresh token.
   * @returns The matching refresh token document, or null when none exists.
   * @example
   * ```ts
   * const token = await repository.findByHash(tokenHash);
   * ```
   */
  findByHash(tokenHash: string) {
    return this.model.findOne({ tokenHash }).exec();
  }

  /**
   * Marks a refresh token as revoked.
   *
   * @param id - Refresh token document identifier.
   * @returns The update result document, or null when no token matches.
   * @example
   * ```ts
   * await repository.revokeById(String(token._id));
   * ```
   */
  revokeById(id: string) {
    return this.model.findByIdAndUpdate(id, { revoked: true }).exec();
  }

  /**
   * Marks all active refresh tokens for a user as revoked.
   *
   * @param userId - AuthAccount document identifier.
   * @returns MongoDB update result for the revoked token set.
   * @example
   * ```ts
   * await repository.revokeAllForUser(userId);
   * ```
   */
  revokeAllForUser(userId: string) {
    return this.model.updateMany({ userId, revoked: false }, { revoked: true }).exec();
  }
}
