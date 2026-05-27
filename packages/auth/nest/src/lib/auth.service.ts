import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { randomBytes, randomInt } from 'crypto';
import { Response } from 'express';
import { AUTH_MODULE_OPTIONS, AuthModuleOptions } from './config/auth-module-options';
import { RefreshTokenRepository } from './tokens/refresh-token.repository';
import { TokenService } from './tokens/token.service';
import { UserDocument } from './user/user.schema';
import { UserService } from './user/user.service';

/**
 * Payload accepted when creating a local email/password account.
 *
 * @example
 * ```ts
 * const dto: RegisterDto = { email: 'user@example.com', password: 'secret' };
 * ```
 */
export interface RegisterDto {
  /**
   * Email address used as the user's local login identifier.
   *
   * @example
   * ```ts
   * dto.email = 'user@example.com';
   * ```
   */
  email: string;

  /**
   * Plain-text password that will be hashed before persistence.
   *
   * @example
   * ```ts
   * dto.password = 'correct-horse-battery-staple';
   * ```
   */
  password: string;

  /**
   * Optional given name stored on the user profile.
   *
   * @example
   * ```ts
   * dto.firstName = 'Ada';
   * ```
   */
  firstName?: string;

  /**
   * Optional family name stored on the user profile.
   *
   * @example
   * ```ts
   * dto.lastName = 'Lovelace';
   * ```
   */
  lastName?: string;
}

/**
 * Payload accepted when completing a password reset.
 *
 * @example
 * ```ts
 * const dto: ResetPasswordDto = { token: 'raw-reset-token', password: 'new-secret' };
 * ```
 */
export interface ResetPasswordDto {
  /**
   * Raw reset token received from the password reset flow.
   *
   * @example
   * ```ts
   * dto.token = 'raw-reset-token';
   * ```
   */
  token: string;

  /**
   * Replacement plain-text password that will be hashed before persistence.
   *
   * @example
   * ```ts
   * dto.password = 'new-secret';
   * ```
   */
  password: string;
}

/**
 * Payload accepted by the development-only login endpoint.
 *
 * @example
 * ```ts
 * const dto: DevLoginDto = { email: 'dev@example.com', password: 'local-only' };
 * ```
 */
export interface DevLoginDto {
  /**
   * Email address submitted as the development username.
   */
  email: string;

  /**
   * Plain-text password submitted for the development account.
   */
  password: string;
}

/**
 * Coordinates account registration, login, token rotation, and profile verification.
 *
 * @example
 * ```ts
 * const user = await authService.getMe(userId);
 * ```
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /**
   * Creates an auth service with user, token, refresh-token, and module-option dependencies.
   *
   * @param userService - User account facade used by auth flows.
   * @param tokenService - Access and refresh token helper.
   * @param refreshTokenRepository - Persistence gateway for refresh token records.
   * @param options - Runtime configuration supplied by AuthModule.forRoot.
   * @example
   * ```ts
   * const service = new AuthService(userService, tokenService, refreshTokenRepository, options);
   * ```
   */
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(AUTH_MODULE_OPTIONS) private readonly options: AuthModuleOptions,
  ) {}

  /**
   * Registers a new local user and stores an email verification token.
   *
   * @param dto - Registration payload with email, password, and optional profile names.
   * @returns The newly persisted user document.
   * @throws BadRequestException When the email address is already registered.
   * @example
   * ```ts
   * const user = await authService.register({ email: 'user@example.com', password: 'secret' });
   * ```
   */
  async register(dto: RegisterDto) {
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email already registered');

    const hashed = await this.userService.hashPassword(dto.password);
    const verificationToken = this.generateVerificationCode();
    const verificationTokenHash = this.hashVerificationCode(verificationToken);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.userService.create({
      email: dto.email,
      password: hashed,
      firstName: dto.firstName,
      lastName: dto.lastName,
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpires: verificationExpires,
    });

    await this.runMailCallback('onRegistered', () => this.options.mail?.onRegistered?.({
      email: user.email,
      name: user.firstName ?? user.email,
      verificationToken,
    }));

    return user;
  }

  /**
   * Starts an authenticated session for an already validated user.
   *
   * @param user - Authenticated user document.
   * @param res - Express response used to write auth cookies.
   * @param userAgent - Optional user-agent captured with the refresh token.
   * @param ip - Optional source IP captured with the refresh token.
   * @returns The authenticated user document.
   * @example
   * ```ts
   * const user = await authService.login(currentUser, response, request.headers['user-agent'], request.ip);
   * ```
   */
  async login(user: UserDocument, res: Response, userAgent?: string, ip?: string) {
    await this.userService.setLastLogin(String(user._id));

    const payload = { sub: String(user._id), email: user.email };
    const accessToken = this.tokenService.signAccessToken(payload);
    const rawRefresh = this.tokenService.signRefreshToken({ ...payload, jti: randomBytes(16).toString('hex') });
    const tokenHash = this.tokenService.hashToken(rawRefresh);
    const refreshMaxAgeMs = this.parseTtlMs(this.options.refreshTokenTtl ?? '7d');
    const expiresAt = new Date(Date.now() + refreshMaxAgeMs);

    await this.refreshTokenRepository.create(String(user._id), tokenHash, expiresAt, userAgent, ip);
    this.tokenService.setAuthCookies(res, accessToken, rawRefresh, { refreshMaxAgeMs });

    return user;
  }

  /**
   * Creates or resolves a configured development user and starts a normal auth session.
   *
   * @param dto - Development credentials supplied by the login form.
   * @param res - Express response used to write auth cookies.
   * @param userAgent - Optional user-agent captured with the refresh token.
   * @param ip - Optional source IP captured with the refresh token.
   * @returns The authenticated development user.
   * @throws ForbiddenException When the feature is disabled or running in production.
   * @throws UnauthorizedException When submitted credentials do not match the configured account.
   * @example
   * ```ts
   * await authService.devLogin({ email: 'dev@example.com', password: 'local-only' }, response);
   * ```
   */
  async devLogin(dto: DevLoginDto, res: Response, userAgent?: string, ip?: string) {
    const config = this.options.devLogin;
    if (process.env['NODE_ENV'] === 'production' || !config?.enabled) {
      throw new ForbiddenException('Development login is disabled');
    }

    if (dto.email.toLowerCase() !== config.email.toLowerCase() || dto.password !== config.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let user = await this.userService.findByEmail(config.email);
    if (!user) {
      user = await this.userService.create({
        email: config.email,
        firstName: config.firstName,
        lastName: config.lastName,
        emailVerified: true,
        permissions: config.permissions ?? ['*'],
        roles: [],
      });
    }

    return this.login(user, res, userAgent, ip);
  }

  /**
   * Ends a session by revoking the presented refresh token and clearing cookies.
   *
   * @param userId - Identifier for the user ending the session.
   * @param refreshTokenRaw - Optional raw refresh token read from the request cookie.
   * @param res - Express response used to clear auth cookies.
   * @returns Resolves after token revocation and cookie clearing finish.
   * @example
   * ```ts
   * await authService.logout(userId, request.cookies.refresh_token, response);
   * ```
   */
  async logout(userId: string, refreshTokenRaw: string | undefined, res: Response) {
    if (refreshTokenRaw) {
      const hash = this.tokenService.hashToken(refreshTokenRaw);
      const token = await this.refreshTokenRepository.findByHash(hash);
      if (token) await this.refreshTokenRepository.revokeById(String(token._id));
    }
    this.tokenService.clearAuthCookies(res);
  }

  /**
   * Rotates a refresh token and issues replacement auth cookies.
   *
   * @param rawRefreshToken - Raw refresh token from the request cookie.
   * @param res - Express response used to write replacement auth cookies.
   * @param userAgent - Optional user-agent captured with the new refresh token.
   * @param ip - Optional source IP captured with the new refresh token.
   * @returns The user document associated with the verified refresh token.
   * @throws UnauthorizedException When the token is invalid, reused, revoked, or references a missing user.
   * @example
   * ```ts
   * const user = await authService.refresh(request.cookies.refresh_token, response);
   * ```
   */
  async refresh(rawRefreshToken: string, res: Response, userAgent?: string, ip?: string) {
    let payload;
    try {
      payload = this.tokenService.verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const hash = this.tokenService.hashToken(rawRefreshToken);
    const stored = await this.refreshTokenRepository.findByHash(hash);

    if (!stored) {
      await this.refreshTokenRepository.revokeAllForUser(payload.sub);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (stored.revoked) {
      await this.refreshTokenRepository.revokeAllForUser(payload.sub);
      throw new UnauthorizedException('Refresh token already used');
    }

    await this.refreshTokenRepository.revokeById(String(stored._id));

    const user = await this.userService.findById(payload.sub);
    if (!user) throw new UnauthorizedException();

    const newAccessToken = this.tokenService.signAccessToken({ sub: payload.sub, email: payload.email });
    const newRawRefresh = this.tokenService.signRefreshToken({
      sub: payload.sub,
      email: payload.email,
      jti: randomBytes(16).toString('hex'),
    });
    const newHash = this.tokenService.hashToken(newRawRefresh);
    const refreshMaxAgeMs = this.parseTtlMs(this.options.refreshTokenTtl ?? '7d');
    const expiresAt = new Date(Date.now() + refreshMaxAgeMs);

    await this.refreshTokenRepository.create(payload.sub, newHash, expiresAt, userAgent, ip);
    this.tokenService.setAuthCookies(res, newAccessToken, newRawRefresh, { refreshMaxAgeMs });

    return user;
  }

  /**
   * Resolves the current user's profile by id.
   *
   * @param userId - User document identifier.
   * @returns The matching user document, or null when none exists.
   * @example
   * ```ts
   * const user = await authService.getMe(userId);
   * ```
   */
  getMe(userId: string) {
    return this.userService.findById(userId);
  }

  /**
   * Completes an OAuth login by creating the session and redirecting the response.
   *
   * @param user - OAuth-authenticated user document.
   * @param res - Express response used for cookies and redirect.
   * @param userAgent - Optional user-agent captured with the refresh token.
   * @param ip - Optional source IP captured with the refresh token.
   * @param invitationState - Optional invitation OAuth state captured before OAuth started.
   * @returns Resolves after the redirect has been sent.
   * @example
   * ```ts
   * await authService.oauthCallback(user, response, request.headers['user-agent'], request.ip);
   * ```
   */
  async oauthCallback(user: UserDocument, res: Response, userAgent?: string, ip?: string, invitationState?: string) {
    await this.login(user, res, userAgent, ip);

    if (invitationState) {
      const redirect = this.options.invitationOAuthRedirect ?? '/accept-invitation/oauth-complete';
      res.redirect(`${redirect}?state=${encodeURIComponent(invitationState)}`);
      return;
    }

    const redirect = this.options.afterOAuthRedirect ?? '/dashboard';
    res.redirect(redirect);
  }

  /**
   * Creates and stores a password reset token for an existing user email.
   *
   * @param email - Email address for the account requesting a reset.
   * @returns Resolves without revealing whether the email exists.
   * @example
   * ```ts
   * await authService.forgotPassword('user@example.com');
   * ```
   */
  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) return;

    const rawToken = randomBytes(32).toString('hex');
    const hashed = this.tokenService.hashToken(rawToken);
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await this.userService.setPasswordResetToken(String(user._id), hashed, expires);

    await this.runMailCallback('onForgotPassword', () => this.options.mail?.onForgotPassword?.({
      email: user.email,
      name: user.firstName ?? user.email,
      resetToken: rawToken,
    }));
  }

  /**
   * Replaces a user's password when the reset token is valid and unexpired.
   *
   * @param rawToken - Raw reset token provided by the reset flow.
   * @param newPassword - Replacement plain-text password.
   * @returns Resolves after the password is replaced and reset token cleared.
   * @throws BadRequestException When the reset token is invalid or expired.
   * @example
   * ```ts
   * await authService.resetPassword('raw-reset-token', 'new-secret');
   * ```
   */
  async resetPassword(rawToken: string, newPassword: string) {
    const hashed = this.tokenService.hashToken(rawToken);
    const user = await this.userService.findByPasswordResetTokenHash(hashed);

    if (!user) throw new BadRequestException('Invalid or expired reset token');

    const hashedPw = await this.userService.hashPassword(newPassword);
    await this.userService.setPassword(String(user._id), hashedPw);
    await this.userService.clearPasswordResetToken(String(user._id));

    await this.runMailCallback('onPasswordReset', () => this.options.mail?.onPasswordReset?.({
      email: user.email,
      name: user.firstName ?? user.email,
    }));
  }

  /**
   * Marks a user's email address verified when the submitted code matches.
   *
   * @param userId - User document identifier.
   * @param otp - Email verification code to compare with the stored token.
   * @returns Resolves after verification succeeds or when the user is already verified.
   * @throws UnauthorizedException When the user cannot be found.
   * @throws BadRequestException When the code is invalid or expired.
   * @example
   * ```ts
   * await authService.verifyEmail(userId, 'A1B2C3');
   * ```
   */
  async verifyEmail(userId: string, otp: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException();
    if (user.emailVerified) return;
    if (!user.emailVerificationToken || user.emailVerificationToken !== this.hashVerificationCode(otp)) {
      throw new BadRequestException('Invalid verification code');
    }
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      throw new BadRequestException('Verification code expired');
    }
    await this.userService.setEmailVerified(userId);
  }

  /**
   * Generates a replacement email verification code for a user.
   *
   * @param userId - User document identifier.
   * @returns Resolves after the new code and expiry are persisted.
   * @example
   * ```ts
   * await authService.resendVerification(userId);
   * ```
   */
  async resendVerification(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) return;

    const token = this.generateVerificationCode();
    const tokenHash = this.hashVerificationCode(token);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.userService.setEmailVerificationToken(userId, tokenHash, expires);

    await this.runMailCallback('onVerificationResent', () => this.options.mail?.onVerificationResent?.({
      email: user.email,
      name: user.firstName ?? user.email,
      verificationToken: token,
    }));
  }

  /**
   * Converts a compact ttl value into milliseconds.
   *
   * @param ttl - Duration string using s, m, h, or d units.
   * @returns The parsed millisecond duration, or seven days for invalid input.
   * @example
   * ```ts
   * const ttlMs = this.parseTtlMs('7d');
   * ```
   */
  private parseTtlMs(ttl: string): number {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const val = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return val * (multipliers[unit] ?? 86_400_000);
  }

  private generateVerificationCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private hashVerificationCode(code: string): string {
    return this.tokenService.hashToken(code);
  }

  private async runMailCallback(name: string, callback: () => Promise<void> | undefined): Promise<void> {
    try {
      await callback();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Auth mail callback ${name} failed: ${message}`);
    }
  }
}
