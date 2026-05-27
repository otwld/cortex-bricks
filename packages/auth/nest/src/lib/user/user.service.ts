import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from './user.schema';
import { UserRepository } from './user.repository';

/**
 * User account facade used by auth strategies and auth workflows.
 *
 * @example
 * ```ts
 * const user = await userService.findByEmail('user@example.com');
 * ```
 */
@Injectable()
export class UserService {
  /**
   * Creates a user service backed by the user repository.
   *
   * @param userRepository - Persistence gateway for user documents.
   * @example
   * ```ts
   * const service = new UserService(userRepository);
   * ```
   */
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Finds a user by document identifier.
   *
   * @param id - User document identifier.
   * @returns The matching user document, or null when none exists.
   * @example
   * ```ts
   * const user = await userService.findById(userId);
   * ```
   */
  findById(id: string) {
    return this.userRepository.findById(id);
  }

  /**
   * Finds a user by email address.
   *
   * @param email - Email address to look up.
   * @returns The matching user document, or null when none exists.
   * @example
   * ```ts
   * const user = await userService.findByEmail('user@example.com');
   * ```
   */
  findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Finds a user by email address and includes the password hash.
   *
   * @param email - Email address to look up.
   * @returns The matching user document with password selected, or null when none exists.
   * @example
   * ```ts
   * const user = await userService.findByEmailWithPassword('user@example.com');
   * ```
   */
  findByEmailWithPassword(email: string) {
    return this.userRepository.findByEmailWithPassword(email);
  }

  /**
   * Finds a user by email or username and includes the password hash.
   *
   * @param identifier - Email address or local username.
   * @returns The matching user with password selected, or null.
   */
  findByEmailOrUsernameWithPassword(identifier: string) {
    return this.userRepository.findByEmailOrUsernameWithPassword(identifier);
  }

  /**
   * Finds a user with a valid password reset token hash.
   *
   * @param tokenHash - Hashed password reset token.
   * @returns The matching user document, or null when the token is unknown or expired.
   */
  findByPasswordResetTokenHash(tokenHash: string) {
    return this.userRepository.findByPasswordResetTokenHash(tokenHash);
  }

  /**
   * Finds several users by document identifiers.
   *
   * @param ids - User document identifiers.
   * @returns Matching auth user documents.
   */
  findByIds(ids: string[]) {
    return this.userRepository.findByIds(ids);
  }

  /**
   * Finds a user linked to a Google profile identifier.
   *
   * @param googleId - Google profile identifier.
   * @returns The matching user document, or null when none exists.
   * @example
   * ```ts
   * const user = await userService.findByGoogleId(profile.id);
   * ```
   */
  findByGoogleId(googleId: string) {
    return this.userRepository.findByGoogleId(googleId);
  }

  /**
   * Finds a user linked to a GitHub profile identifier.
   *
   * @param githubId - GitHub profile identifier.
   * @returns The matching user document, or null when none exists.
   * @example
   * ```ts
   * const user = await userService.findByGithubId(profile.id);
   * ```
   */
  findByGithubId(githubId: string) {
    return this.userRepository.findByGithubId(githubId);
  }

  /**
   * Creates a new user document.
   *
   * @param dto - Partial user values to persist.
   * @returns The saved user document.
   * @example
   * ```ts
   * const user = await userService.create({ email: 'user@example.com' });
   * ```
   */
  create(dto: Partial<User>) {
    return this.userRepository.create(dto);
  }

  /**
   * Hashes a plain-text password with bcrypt.
   *
   * @param plain - Plain-text password to hash.
   * @returns Bcrypt password hash.
   * @example
   * ```ts
   * const hash = await userService.hashPassword('secret');
   * ```
   */
  hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 12);
  }

  /**
   * Compares a plain-text password with a bcrypt hash.
   *
   * @param plain - Plain-text password to validate.
   * @param hash - Stored bcrypt hash.
   * @returns True when the password matches the hash.
   * @example
   * ```ts
   * const valid = await userService.validatePassword('secret', user.password);
   * ```
   */
  validatePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  /**
   * Sets a local username and password for an auth account.
   *
   * @param id - Auth account identifier.
   * @param password - Plain-text password selected by the user.
   * @param username - Optional local username.
   * @returns The updated auth user or null.
   */
  async setLocalCredentials(id: string, password: string, username?: string) {
    const hashed = await this.hashPassword(password);
    return this.userRepository.updateById(id, { password: hashed, username });
  }

  /**
   * Stores a pre-hashed password on a user.
   *
   * @param id - User document identifier.
   * @param passwordHash - Bcrypt password hash to persist.
   * @returns The updated user document, or null when none exists.
   */
  setPassword(id: string, passwordHash: string) {
    return this.userRepository.updateById(id, { password: passwordHash });
  }

  /**
   * Updates the user's last successful login timestamp.
   *
   * @param id - User document identifier.
   * @returns The updated user document, or null when none exists.
   * @example
   * ```ts
   * await userService.setLastLogin(userId);
   * ```
   */
  setLastLogin(id: string) {
    return this.userRepository.updateById(id, { lastLoginAt: new Date() });
  }

  /**
   * Marks the user's email verified and clears verification fields.
   *
   * @param id - User document identifier.
   * @returns The updated user document, or null when none exists.
   * @example
   * ```ts
   * await userService.setEmailVerified(userId);
   * ```
   */
  setEmailVerified(id: string) {
    return this.userRepository.updateById(id, {
      emailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined,
    });
  }

  /**
   * Stores a hashed email verification token and expiry on a user.
   *
   * @param id - User document identifier.
   * @param token - Hashed email verification token.
   * @param expires - Expiry timestamp for the verification token.
   * @returns The updated user document, or null when none exists.
   */
  setEmailVerificationToken(id: string, token: string, expires: Date) {
    return this.userRepository.updateById(id, { emailVerificationToken: token, emailVerificationExpires: expires });
  }

  /**
   * Stores a password reset token hash and expiry on a user.
   *
   * @param id - User document identifier.
   * @param token - Hashed password reset token.
   * @param expires - Expiry timestamp for the reset token.
   * @returns The updated user document, or null when none exists.
   * @example
   * ```ts
   * await userService.setPasswordResetToken(userId, tokenHash, expiresAt);
   * ```
   */
  setPasswordResetToken(id: string, token: string, expires: Date) {
    return this.userRepository.updateById(id, { passwordResetToken: token, passwordResetExpires: expires });
  }

  /**
   * Clears password reset fields from a user.
   *
   * @param id - User document identifier.
   * @returns The updated user document, or null when none exists.
   * @example
   * ```ts
   * await userService.clearPasswordResetToken(userId);
   * ```
   */
  clearPasswordResetToken(id: string) {
    return this.userRepository.updateById(id, { passwordResetToken: undefined, passwordResetExpires: undefined });
  }
}
