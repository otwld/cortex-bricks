import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import type { CookieOptions } from 'express';

/**
 * Injection token for the JWT service configured to sign access tokens.
 *
 * @example
 * ```ts
 * providers: [{ provide: ACCESS_JWT_SERVICE, useValue: accessJwtService }]
 * ```
 */
export const ACCESS_JWT_SERVICE = 'ACCESS_JWT_SERVICE';

/**
 * Injection token for the JWT service configured to sign refresh tokens.
 *
 * @example
 * ```ts
 * providers: [{ provide: REFRESH_JWT_SERVICE, useValue: refreshJwtService }]
 * ```
 */
export const REFRESH_JWT_SERVICE = 'REFRESH_JWT_SERVICE';

/**
 * Minimal JWT payload shared by access and refresh tokens.
 *
 * @example
 * ```ts
 * const payload: JwtPayload = { sub: userId, email: 'user@example.com' };
 * ```
 */
export interface JwtPayload {
  /**
   * Subject claim containing the user identifier.
   *
   * @example
   * ```ts
   * payload.sub = '64f1f77bcf86cd799439011';
   * ```
   */
  sub: string;

  /**
   * Email address associated with the token subject.
   *
   * @example
   * ```ts
   * payload.email = 'user@example.com';
   * ```
   */
  email: string;

  /**
   * Optional unique token identifier used to keep refresh tokens distinct.
   *
   * @example
   * ```ts
   * payload.jti = 'random-token-id';
   * ```
   */
  jti?: string;
}

/**
 * Cookie max-age overrides used when writing auth cookies.
 *
 * @example
 * ```ts
 * tokenService.setAuthCookies(res, accessToken, refreshToken, { refreshMaxAgeMs: 3_600_000 });
 * ```
 */
export interface AuthCookieOptions {
  /**
   * Access-token cookie max age in milliseconds.
   */
  accessMaxAgeMs?: number;

  /**
   * Refresh-token cookie max age in milliseconds.
   */
  refreshMaxAgeMs?: number;
}

/** Response surface needed to write and clear auth cookies. */
export interface AuthCookieResponse {
  /** Write one cookie. */
  cookie(name: string, value: string, options: CookieOptions): this;
  /** Clear one cookie. */
  clearCookie(name: string, options?: CookieOptions): this;
}

/** Response surface needed by OAuth callbacks after cookies are written. */
export interface AuthRedirectResponse extends AuthCookieResponse {
  /** Redirect the client to a completed-auth route. */
  redirect(url: string): void;
}

/**
 * Signs, verifies, hashes, and stores auth tokens in HTTP cookies.
 *
 * @example
 * ```ts
 * const accessToken = tokenService.signAccessToken({ sub: userId, email });
 * ```
 */
@Injectable()
export class TokenService {
  /**
   * Creates a token service with separately configured access and refresh JWT services.
   *
   * @param accessJwt - JWT service configured with access-token signing options.
   * @param refreshJwt - JWT service configured with refresh-token signing options.
   * @example
   * ```ts
   * const service = new TokenService(accessJwtService, refreshJwtService);
   * ```
   */
  constructor(
    @Inject(ACCESS_JWT_SERVICE) private readonly accessJwt: JwtService,
    @Inject(REFRESH_JWT_SERVICE) private readonly refreshJwt: JwtService,
  ) {}

  /**
   * Signs an access JWT for the supplied auth payload.
   *
   * @param payload - Subject and email claims to encode.
   * @returns Signed access token string.
   * @example
   * ```ts
   * const token = tokenService.signAccessToken({ sub: userId, email });
   * ```
   */
  signAccessToken(payload: JwtPayload): string {
    return this.accessJwt.sign(payload);
  }

  /**
   * Signs a refresh JWT for the supplied auth payload.
   *
   * @param payload - Subject and email claims to encode.
   * @returns Signed refresh token string.
   * @example
   * ```ts
   * const token = tokenService.signRefreshToken({ sub: userId, email });
   * ```
   */
  signRefreshToken(payload: JwtPayload): string {
    return this.refreshJwt.sign(payload);
  }

  /**
   * Verifies and decodes a refresh JWT.
   *
   * @param token - Signed refresh token string.
   * @returns Verified JWT payload.
   * @throws JsonWebTokenError When the token cannot be verified by Nest JWT.
   * @example
   * ```ts
   * const payload = tokenService.verifyRefreshToken(refreshToken);
   * ```
   */
  verifyRefreshToken(token: string): JwtPayload {
    return this.refreshJwt.verify<JwtPayload>(token);
  }

  /**
   * Generates a cryptographically random raw refresh token.
   *
   * @returns Hex-encoded token string.
   * @example
   * ```ts
   * const raw = tokenService.generateRawToken();
   * ```
   */
  generateRawToken(): string {
    return randomBytes(40).toString('hex');
  }

  /**
   * Hashes a raw token for storage and comparison.
   *
   * @param token - Raw token string.
   * @returns SHA-256 hex digest.
   * @example
   * ```ts
   * const digest = tokenService.hashToken(rawToken);
   * ```
   */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Writes access and refresh tokens to HTTP-only cookies.
   *
   * @param res - HTTP response receiving the cookies.
   * @param accessToken - Signed access token value.
   * @param refreshToken - Raw refresh token value.
   * @returns Nothing.
   * @example
   * ```ts
   * tokenService.setAuthCookies(response, accessToken, rawRefreshToken, { refreshMaxAgeMs });
   * ```
   */
  setAuthCookies(res: AuthCookieResponse, accessToken: string, refreshToken: string, options: AuthCookieOptions = {}): void {
    const secure = process.env['NODE_ENV'] === 'production';
    const cookieOpts = { httpOnly: true, secure, sameSite: 'strict' as const, path: '/' };
    res.cookie('access_token', accessToken, { ...cookieOpts, maxAge: options.accessMaxAgeMs ?? 15 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { ...cookieOpts, maxAge: options.refreshMaxAgeMs ?? 7 * 24 * 60 * 60 * 1000 });
  }

  /**
   * Clears the access and refresh token cookies.
   *
   * @param res - HTTP response whose cookies should be cleared.
   * @returns Nothing.
   * @example
   * ```ts
   * tokenService.clearAuthCookies(response);
   * ```
   */
  clearAuthCookies(res: AuthCookieResponse): void {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
  }
}
