import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import type { ClientSession } from 'mongoose';
import { AuthAccount } from './auth-account.schema';
import { AuthAccountRepository } from './auth-account.repository';

/** Payload used to create an auth account that is waiting for invitation acceptance. */
export interface CreatePendingAuthAccount {
  /** Account email address. */
  email: string;
  /** Optional local username. */
  username?: string;
  /** Optional given name. */
  firstName?: string;
  /** Optional family name. */
  lastName?: string;
  /** Optional profile image URL. */
  avatar?: string;
  /** Assigned roles copied from user management. */
  roles?: AuthAccount['roles'];
  /** Direct permissions copied from user management. */
  permissions?: string[];
}

/**
 * Auth account facade used by auth strategies and auth workflows.
 *
 * @example
 * ```ts
 * const account = await authAccountService.findByEmail('user@example.com');
 * ```
 */
@Injectable()
export class AuthAccountService {
  /**
   * Creates an auth account service backed by the auth account repository.
   *
   * @param userRepository - Persistence gateway for auth account documents.
   * @example
   * ```ts
   * const service = new AuthAccountService(repository);
   * ```
   */
  constructor(private readonly userRepository: AuthAccountRepository) {}

  /**
   * Finds an auth account by document identifier.
   *
   * @param id - AuthAccount document identifier.
   * @returns The matching auth account document, or null when none exists.
   * @example
   * ```ts
   * const account = await authAccountService.findById(accountId);
   * ```
   */
  findById(id: string) {
    return this.userRepository.findById(id);
  }

  /**
   * Finds an auth account by email address.
   *
   * @param email - Email address to look up.
   * @returns The matching auth account document, or null when none exists.
   * @example
   * ```ts
   * const account = await authAccountService.findByEmail('user@example.com');
   * ```
   */
  findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Finds an auth account by email address and includes the password hash.
   *
   * @param email - Email address to look up.
   * @returns The matching auth account document with password selected, or null when none exists.
   * @example
   * ```ts
   * const account = await authAccountService.findByEmailWithPassword('user@example.com');
   * ```
   */
  findByEmailWithPassword(email: string) {
    return this.userRepository.findByEmailWithPassword(email);
  }

  /**
   * Finds an auth account by email or username and includes the password hash.
   *
   * @param identifier - Email address or local username.
   * @returns The matching auth account with password selected, or null.
   */
  findByEmailOrUsernameWithPassword(identifier: string) {
    return this.userRepository.findByEmailOrUsernameWithPassword(identifier);
  }

  /**
   * Finds an auth account with a valid password reset token hash.
   *
   * @param tokenHash - Hashed password reset token.
   * @returns The matching auth account document, or null when the token is unknown or expired.
   */
  findByPasswordResetTokenHash(tokenHash: string) {
    return this.userRepository.findByPasswordResetTokenHash(tokenHash);
  }

  /**
   * Finds several auth accounts by document identifiers.
   *
   * @param ids - AuthAccount document identifiers.
   * @returns Matching auth account documents.
   */
  findByIds(ids: string[]) {
    return this.userRepository.findByIds(ids);
  }

  /**
   * Finds an auth account linked to a Google profile identifier.
   *
   * @param googleId - Google profile identifier.
   * @returns The matching auth account document, or null when none exists.
   * @example
   * ```ts
   * const account = await authAccountService.findByGoogleId(profile.id);
   * ```
   */
  findByGoogleId(googleId: string) {
    return this.userRepository.findByGoogleId(googleId);
  }

  /**
   * Finds an auth account linked to a GitHub profile identifier.
   *
   * @param githubId - GitHub profile identifier.
   * @returns The matching auth account document, or null when none exists.
   * @example
   * ```ts
   * const account = await authAccountService.findByGithubId(profile.id);
   * ```
   */
  findByGithubId(githubId: string) {
    return this.userRepository.findByGithubId(githubId);
  }

  /**
   * Creates a new auth account document.
   *
   * @param dto - Partial auth account values to persist.
   * @returns The saved auth account document.
   * @example
   * ```ts
   * const account = await authAccountService.create({ email: 'user@example.com' });
   * ```
   */
  create(dto: Partial<AuthAccount>, session?: ClientSession) {
    return this.userRepository.create(dto, session);
  }

  /**
   * Creates an auth account that cannot use local login until credentials are set.
   *
   * @param dto - Account identity, profile mirror fields, and assignments.
   * @param session - Optional MongoDB transaction session.
   * @returns The saved pending auth account document.
   */
  createPendingAccount(dto: CreatePendingAuthAccount, session?: ClientSession) {
    return this.create(
      {
        email: dto.email.toLowerCase(),
        username: dto.username,
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatar: dto.avatar,
        emailVerified: false,
        roles: dto.roles ?? [],
        permissions: dto.permissions ?? [],
      },
      session,
    );
  }

  /**
   * Updates auth assignment and profile mirror fields.
   *
   * @param id - Auth account identifier.
   * @param update - Partial account fields to mirror from user management.
   * @param session - Optional MongoDB transaction session.
   * @returns The updated auth account, or null when none exists.
   */
  updateAssignments(id: string, update: Partial<AuthAccount>, session?: ClientSession) {
    return this.userRepository.updateById(id, update, session);
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
  async setLocalCredentials(id: string, password: string, username?: string, session?: ClientSession) {
    const hashed = await this.hashPassword(password);
    return this.userRepository.updateById(id, { password: hashed, username }, session);
  }

  /**
   * Stores a pre-hashed password on a user.
   *
   * @param id - AuthAccount document identifier.
   * @param passwordHash - Bcrypt password hash to persist.
   * @returns The updated user document, or null when none exists.
   */
  setPassword(id: string, passwordHash: string, session?: ClientSession) {
    return this.userRepository.updateById(id, { password: passwordHash }, session);
  }

  /**
   * Changes an account password after validating the current password.
   *
   * @param id - Auth account identifier.
   * @param currentPassword - Plain-text current password.
   * @param newPassword - Plain-text replacement password.
   * @returns Resolves after the password is stored.
   * @throws UnauthorizedException when the current password is missing or invalid.
   */
  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const account = await this.userRepository.findByIdWithPassword(id);
    if (!account?.password) throw new UnauthorizedException('Current password is invalid');
    const valid = await this.validatePassword(currentPassword, account.password);
    if (!valid) throw new UnauthorizedException('Current password is invalid');
    await this.setPassword(id, await this.hashPassword(newPassword));
  }

  /**
   * Updates the user's last successful login timestamp.
   *
   * @param id - AuthAccount document identifier.
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
   * @param id - AuthAccount document identifier.
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
   * @param id - AuthAccount document identifier.
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
   * @param id - AuthAccount document identifier.
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
   * @param id - AuthAccount document identifier.
   * @returns The updated user document, or null when none exists.
   * @example
   * ```ts
   * await userService.clearPasswordResetToken(userId);
   * ```
   */
  clearPasswordResetToken(id: string) {
    return this.userRepository.updateById(id, { passwordResetToken: undefined, passwordResetExpires: undefined });
  }

  /**
   * Disables an auth account by clearing credentials, providers, reset state, and assignments.
   *
   * @param id - Auth account identifier.
   * @param session - Optional MongoDB transaction session.
   * @returns The disabled auth account, or null when none exists.
   */
  disableAccount(id: string, session?: ClientSession) {
    return this.userRepository.disableAccount(id, session);
  }

  /**
   * Generates a raw password reset token and stores only its hash.
   *
   * @param email - Account email address.
   * @returns Reset token details when the account exists; otherwise undefined.
   */
  async requestPasswordReset(email: string) {
    const account = await this.findByEmail(email);
    if (!account) return undefined;
    const rawToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.setPasswordResetToken(String(account._id), this.hashToken(rawToken), expiresAt);
    return { rawToken, expiresAt, user: account };
  }

  /**
   * Resets an account password using a valid raw reset token.
   *
   * @param rawToken - Raw password reset token sent to the user.
   * @param newPassword - Plain-text replacement password.
   * @returns The account that owned the reset token.
   * @throws BadRequestException when the token is invalid or expired.
   */
  async resetPassword(rawToken: string, newPassword: string) {
    const account = await this.findByPasswordResetTokenHash(this.hashToken(rawToken));
    if (!account) throw new BadRequestException('Invalid or expired reset token');
    await this.setPassword(String(account._id), await this.hashPassword(newPassword));
    await this.clearPasswordResetToken(String(account._id));
    return account;
  }

  /** Hashes reset tokens before persistence. */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
