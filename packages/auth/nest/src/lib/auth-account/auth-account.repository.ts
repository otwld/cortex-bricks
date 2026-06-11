import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { AuthAccount, AuthAccountDocument } from './auth-account.schema';

/**
 * Persistence gateway for auth account documents.
 *
 * @example
 * ```ts
 * const account = await repository.findByEmail('user@example.com');
 * ```
 */
@Injectable()
export class AuthAccountRepository {
  /**
   * Creates an auth account repository backed by the Mongoose model.
   *
   * @param userModel - Mongoose model for auth account documents.
   * @example
   * ```ts
   * const repository = new AuthAccountRepository(userModel);
   * ```
   */
  constructor(@InjectModel(AuthAccount.name) private readonly userModel: Model<AuthAccountDocument>) {}

  /**
   * Finds an auth account by document identifier.
   *
   * @param id - AuthAccount document identifier.
   * @returns The matching auth account document, or null when none exists.
   * @example
   * ```ts
   * const account = await repository.findById(userId);
   * ```
   */
  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  /**
   * Finds an auth account by email after lower-casing the lookup value.
   *
   * @param email - Email address to look up.
   * @returns The matching auth account document, or null when none exists.
   * @example
   * ```ts
   * const account = await repository.findByEmail('USER@example.com');
   * ```
   */
  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  /**
   * Finds an auth account by email and includes the normally hidden password hash.
   *
   * @param email - Email address to look up.
   * @returns The matching auth account document with password selected, or null when none exists.
   * @example
   * ```ts
   * const account = await repository.findByEmailWithPassword('user@example.com');
   * ```
   */
  findByEmailWithPassword(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  /**
   * Finds an auth account by email or username and includes the hidden password hash.
   *
   * @param identifier - Email address or local username.
   * @returns The matching auth account with password selected, or null.
   */
  findByEmailOrUsernameWithPassword(identifier: string) {
    const value = identifier.toLowerCase();
    return this.userModel.findOne({ $or: [{ email: value }, { username: value }] }).select('+password').exec();
  }

  /**
   * Finds an auth account with a valid password reset token hash.
   *
   * @param tokenHash - Hashed password reset token.
   * @returns The matching auth account document, or null when the token is unknown or expired.
   */
  findByPasswordResetTokenHash(tokenHash: string) {
    return this.userModel.findOne({ passwordResetToken: tokenHash, passwordResetExpires: { $gt: new Date() } }).exec();
  }

  /**
   * Finds several auth accounts by document identifiers.
   *
   * @param ids - AuthAccount document identifiers.
   * @returns Matching auth account documents.
   */
  findByIds(ids: string[]) {
    return this.userModel.find({ _id: { $in: ids } }).exec();
  }

  /**
   * Finds an auth account linked to a Google profile identifier.
   *
   * @param googleId - Google profile identifier.
   * @returns The matching auth account document, or null when none exists.
   * @example
   * ```ts
   * const account = await repository.findByGoogleId(profile.id);
   * ```
   */
  findByGoogleId(googleId: string) {
    return this.userModel.findOne({ googleId }).exec();
  }

  /**
   * Finds an auth account linked to a GitHub profile identifier.
   *
   * @param githubId - GitHub profile identifier.
   * @returns The matching auth account document, or null when none exists.
   * @example
   * ```ts
   * const account = await repository.findByGithubId(profile.id);
   * ```
   */
  findByGithubId(githubId: string) {
    return this.userModel.findOne({ githubId }).exec();
  }

  /**
   * Creates and saves a new auth account document.
   *
   * @param dto - Partial auth account values to persist.
   * @returns The saved auth account document.
   * @example
   * ```ts
   * const account = await repository.create({ email: 'user@example.com' });
   * ```
   */
  create(dto: Partial<AuthAccount>, session?: ClientSession) {
    return new this.userModel(dto).save({ session });
  }

  /**
   * Updates an auth account document and returns the updated value.
   *
   * @param id - AuthAccount document identifier.
   * @param update - Partial auth account values to apply.
   * @returns The updated auth account document, or null when none exists.
   * @example
   * ```ts
   * await repository.updateById(userId, { lastLoginAt: new Date() });
   * ```
   */
  updateById(id: string, update: Partial<AuthAccount>, session?: ClientSession) {
    return this.userModel.findByIdAndUpdate(id, update, { new: true, session }).exec();
  }

  /**
   * Finds an auth account by id and includes the hidden password hash.
   *
   * @param id - AuthAccount document identifier.
   * @returns The matching auth account with password selected, or null.
   */
  findByIdWithPassword(id: string) {
    return this.userModel.findById(id).select('+password').exec();
  }

  /**
   * Disables an auth account by clearing credentials, providers, reset state, and assignments.
   *
   * @param id - AuthAccount document identifier.
   * @param session - Optional MongoDB transaction session.
   * @returns The updated auth account document, or null when none exists.
   */
  disableAccount(id: string, session?: ClientSession) {
    return this.userModel
      .findByIdAndUpdate(
        id,
        {
          emailVerified: false,
          roles: [],
          permissions: [],
          $unset: {
            password: '',
            googleId: '',
            githubId: '',
            passwordResetToken: '',
            passwordResetExpires: '',
            emailVerificationToken: '',
            emailVerificationExpires: '',
          },
        },
        { new: true, session },
      )
      .exec();
  }
}
