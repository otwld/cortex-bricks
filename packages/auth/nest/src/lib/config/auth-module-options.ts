import { Type } from '@nestjs/common';
import type { JwtSignOptions } from '@nestjs/jwt';
import type { NestFeatureModuleClassAsyncOptions } from '@otwld/nest-sdk';
import { Schema } from 'mongoose';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';

/**
 * Injection token for auth module runtime options.
 *
 * @example
 * ```ts
 * providers: [{ provide: AUTH_MODULE_OPTIONS, useValue: options }]
 * ```
 */
export const AUTH_MODULE_OPTIONS = Symbol('AUTH_MODULE_OPTIONS');

/** Parameters passed to the `onRegistered` mail callback. */
export interface AuthMailRegisteredParams {
  /** Recipient email address. */
  email: string;
  /** AuthAccount's first name, or email if no name is set. */
  name: string;
  /** Raw email verification token. */
  verificationToken: string;
}

/** Parameters passed to the `onForgotPassword` mail callback. */
export interface AuthMailForgotPasswordParams {
  /** Recipient email address. */
  email: string;
  /** AuthAccount's first name, or email if no name is set. */
  name: string;
  /** Raw password reset token. */
  resetToken: string;
}

/** Parameters passed to the `onPasswordReset` mail callback. */
export interface AuthMailPasswordResetParams {
  /** Recipient email address. */
  email: string;
  /** AuthAccount's first name, or email if no name is set. */
  name: string;
}

/** Parameters passed to the `onVerificationResent` mail callback. */
export interface AuthMailVerificationResentParams {
  /** Recipient email address. */
  email: string;
  /** AuthAccount's first name, or email if no name is set. */
  name: string;
  /** Fresh raw email verification token. */
  verificationToken: string;
}

/** Optional mail callbacks wired into auth lifecycle events. */
export interface AuthModuleMailOptions {
  /** Called after a new user registers. Send a welcome or verify-email message here. */
  onRegistered?: (params: AuthMailRegisteredParams) => Promise<void>;
  /** Called after a password reset token is generated. Send a reset-password link here. */
  onForgotPassword?: (params: AuthMailForgotPasswordParams) => Promise<void>;
  /** Called after a password has been successfully reset. */
  onPasswordReset?: (params: AuthMailPasswordResetParams) => Promise<void>;
  /** Called after a new verification code is generated. */
  onVerificationResent?: (params: AuthMailVerificationResentParams) => Promise<void>;
}

/**
 * Runtime configuration accepted by AuthModule.forRoot.
 *
 * @example
 * ```ts
 * const options: AuthModuleOptions = { jwtSecret, jwtRefreshSecret, abilityFactory: AppAbilityFactory };
 * ```
 */
export interface AuthModuleOptions {
  /**
   * Secret used to sign and verify access JWTs.
   *
   * @example
   * ```ts
   * options.jwtSecret = process.env.JWT_SECRET!;
   * ```
   */
  jwtSecret: string;

  /**
   * Secret used to sign and verify refresh JWTs.
   *
   * @example
   * ```ts
   * options.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
   * ```
   */
  jwtRefreshSecret: string;

  /**
   * Application CASL ability factory provider.
   *
   * @example
   * ```ts
   * options.abilityFactory = AppAbilityFactory;
   * ```
   */
  abilityFactory: Type<CaslAbilityFactory>;

  /**
   * Optional Google OAuth client configuration.
   *
   * @example
   * ```ts
   * options.google = { clientId, clientSecret, callbackUrl };
   * ```
   */
  google?: {
    /**
     * Google OAuth client id.
     *
     * @example
     * ```ts
     * options.google.clientId = clientId;
     * ```
     */
    clientId: string;

    /**
     * Google OAuth client secret.
     *
     * @example
     * ```ts
     * options.google.clientSecret = clientSecret;
     * ```
     */
    clientSecret: string;

    /**
     * Google OAuth callback URL registered with the provider.
     *
     * @example
     * ```ts
     * options.google.callbackUrl = 'https://app.example.com/auth/google/callback';
     * ```
     */
    callbackUrl: string;
  };

  /**
   * Optional GitHub OAuth client configuration.
   *
   * @example
   * ```ts
   * options.github = { clientId, clientSecret, callbackUrl };
   * ```
   */
  github?: {
    /**
     * GitHub OAuth client id.
     *
     * @example
     * ```ts
     * options.github.clientId = clientId;
     * ```
     */
    clientId: string;

    /**
     * GitHub OAuth client secret.
     *
     * @example
     * ```ts
     * options.github.clientSecret = clientSecret;
     * ```
     */
    clientSecret: string;

    /**
     * GitHub OAuth callback URL registered with the provider.
     *
     * @example
     * ```ts
     * options.github.callbackUrl = 'https://app.example.com/auth/github/callback';
     * ```
     */
    callbackUrl: string;
  };

  /**
   * Optional auth account schema override registered in the auth module.
   *
   * @example
   * ```ts
   * options.authAccountSchema = customAuthAccountSchema;
   * ```
   */
  authAccountSchema?: Schema;

  /**
   * Enabled Passport strategies.
   *
   * @example
   * ```ts
   * options.strategies = ['local', 'jwt'];
   * ```
   */
  strategies?: string[];

  /**
   * Access token time-to-live accepted by the underlying JWT signer.
   *
   * @example
   * ```ts
   * options.accessTokenTtl = '15m';
   * ```
   */
  accessTokenTtl?: JwtSignOptions['expiresIn'];

  /**
   * Refresh token time-to-live accepted by the underlying JWT signer.
   *
   * @example
   * ```ts
   * options.refreshTokenTtl = '7d';
   * ```
   */
  refreshTokenTtl?: JwtSignOptions['expiresIn'];

  /**
   * Redirect target used after successful OAuth callbacks.
   *
   * @example
   * ```ts
   * options.afterOAuthRedirect = '/dashboard';
   * ```
   */
  afterOAuthRedirect?: string;

  /**
   * Redirect target used after OAuth completes with an invitation token cookie.
   */
  invitationOAuthRedirect?: string;

  /**
   * Optional development-only credential login configuration.
   *
   * @example
   * ```ts
   * options.devLogin = { enabled: true, email: 'dev@example.com', password: 'local-only' };
   * ```
   */
  devLogin?: {
    /**
     * Enables the development login endpoint outside production.
     */
    enabled: boolean;

    /**
     * Email address accepted by the development login endpoint.
     */
    email: string;

    /**
     * Password accepted by the development login endpoint.
     */
    password: string;

    /**
     * Optional given name for the generated development user.
     */
    firstName?: string;

    /**
     * Optional family name for the generated development user.
     */
    lastName?: string;

    /**
     * Direct permissions assigned to the generated development user.
     */
    permissions?: string[];
  };

  /** Optional mail event callbacks. When omitted, no emails are sent by the auth module. */
  mail?: AuthModuleMailOptions;
}

/** Factory interface for async auth module configuration. */
export interface AuthModuleOptionsFactory {
  createAuthOptions(): Promise<AuthModuleOptions> | AuthModuleOptions;
}

/** Options accepted by `AuthModule.forRootAsync`. */
export type AuthModuleAsyncOptions = NestFeatureModuleClassAsyncOptions<
  AuthModuleOptions,
  AuthModuleOptionsFactory
>;
