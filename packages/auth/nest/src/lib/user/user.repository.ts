import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

/**
 * Persistence gateway for user documents.
 *
 * @example
 * ```ts
 * const user = await repository.findByEmail('user@example.com');
 * ```
 */
@Injectable()
export class UserRepository {
  /**
   * Creates a user repository backed by the Mongoose user model.
   *
   * @param userModel - Mongoose model for user documents.
   * @example
   * ```ts
   * const repository = new UserRepository(userModel);
   * ```
   */
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  /**
   * Finds a user by document identifier.
   *
   * @param id - User document identifier.
   * @returns The matching user document, or null when none exists.
   * @example
   * ```ts
   * const user = await repository.findById(userId);
   * ```
   */
  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  /**
   * Finds a user by email after lower-casing the lookup value.
   *
   * @param email - Email address to look up.
   * @returns The matching user document, or null when none exists.
   * @example
   * ```ts
   * const user = await repository.findByEmail('USER@example.com');
   * ```
   */
  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  /**
   * Finds a user by email and includes the normally hidden password hash.
   *
   * @param email - Email address to look up.
   * @returns The matching user document with password selected, or null when none exists.
   * @example
   * ```ts
   * const user = await repository.findByEmailWithPassword('user@example.com');
   * ```
   */
  findByEmailWithPassword(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  /**
   * Finds a user by email or username and includes the hidden password hash.
   *
   * @param identifier - Email address or local username.
   * @returns The matching user with password selected, or null.
   */
  findByEmailOrUsernameWithPassword(identifier: string) {
    const value = identifier.toLowerCase();
    return this.userModel.findOne({ $or: [{ email: value }, { username: value }] }).select('+password').exec();
  }

  /**
   * Finds a user with a valid password reset token hash.
   *
   * @param tokenHash - Hashed password reset token.
   * @returns The matching user document, or null when the token is unknown or expired.
   */
  findByPasswordResetTokenHash(tokenHash: string) {
    return this.userModel.findOne({ passwordResetToken: tokenHash, passwordResetExpires: { $gt: new Date() } }).exec();
  }

  /**
   * Finds several users by document identifiers.
   *
   * @param ids - User document identifiers.
   * @returns Matching auth user documents.
   */
  findByIds(ids: string[]) {
    return this.userModel.find({ _id: { $in: ids } }).exec();
  }

  /**
   * Finds a user linked to a Google profile identifier.
   *
   * @param googleId - Google profile identifier.
   * @returns The matching user document, or null when none exists.
   * @example
   * ```ts
   * const user = await repository.findByGoogleId(profile.id);
   * ```
   */
  findByGoogleId(googleId: string) {
    return this.userModel.findOne({ googleId }).exec();
  }

  /**
   * Finds a user linked to a GitHub profile identifier.
   *
   * @param githubId - GitHub profile identifier.
   * @returns The matching user document, or null when none exists.
   * @example
   * ```ts
   * const user = await repository.findByGithubId(profile.id);
   * ```
   */
  findByGithubId(githubId: string) {
    return this.userModel.findOne({ githubId }).exec();
  }

  /**
   * Creates and saves a new user document.
   *
   * @param dto - Partial user values to persist.
   * @returns The saved user document.
   * @example
   * ```ts
   * const user = await repository.create({ email: 'user@example.com' });
   * ```
   */
  create(dto: Partial<User>) {
    return new this.userModel(dto).save();
  }

  /**
   * Updates a user document and returns the updated value.
   *
   * @param id - User document identifier.
   * @param update - Partial user values to apply.
   * @returns The updated user document, or null when none exists.
   * @example
   * ```ts
   * await repository.updateById(userId, { lastLoginAt: new Date() });
   * ```
   */
  updateById(id: string, update: Partial<User>) {
    return this.userModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }
}
