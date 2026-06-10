import type { UserPermission, UserRole } from '@otwld/ts-users';

/**
 * OAuth providers that the auth bricks know how to start and normalize.
 *
 * These values are shared by browser routing, NestJS strategy selection, and
 * provider-profile normalization, so additions here must be backed by runtime
 * support in the owning auth packages.
 */
export const AUTH_SOCIAL_PROVIDERS = ['google', 'github'] as const;

/**
 * Supported external identity providers for social authorization flows.
 */
export type AuthSocialProvider = (typeof AUTH_SOCIAL_PROVIDERS)[number];

/**
 * All identity providers that can produce an auth session.
 *
 * `credentials` represents first-party email/password authentication; the
 * remaining values represent social providers listed in
 * `AUTH_SOCIAL_PROVIDERS`.
 */
export const AUTH_IDENTITY_PROVIDERS = [
  'credentials',
  ...AUTH_SOCIAL_PROVIDERS,
] as const;

/**
 * Provider identifier stored on normalized profiles and auth session payloads.
 */
export type AuthIdentityProvider = (typeof AUTH_IDENTITY_PROVIDERS)[number];

/**
 * Intent values accepted by social authorization endpoints.
 *
 * The intent lets a caller distinguish between a login redirect and an account
 * registration redirect without coupling the transport payload to a route name.
 */
export const AUTH_FLOW_INTENTS = ['login', 'register'] as const;

/**
 * User-facing social authorization flow requested by the client.
 */
export type AuthFlowIntent = (typeof AUTH_FLOW_INTENTS)[number];

/**
 * Authenticated user shape shared across auth API responses and browser state.
 *
 * Permission and role values come from the framework-neutral users package so
 * Angular guards, NestJS policies, and persisted auth records evaluate the same
 * authorization vocabulary.
 */
export interface AuthUser {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  emailVerified: boolean;
  roles: UserRole[];
  permissions: UserPermission[];
  lastLoginAt?: string;
}

/**
 * Current authentication state returned to browser clients.
 *
 * Anonymous sessions keep `authenticated` false and `user` null. Authenticated
 * sessions may include an expiration timestamp when the backend exposes token
 * lifetime details.
 */
export interface AuthSessionDto {
  authenticated: boolean;
  expiresAt?: string | null;
  user: AuthUser | null;
}

/**
 * Standard result envelope for auth mutations that can update client session
 * state.
 *
 * Mutations such as registration can return a message without an immediate
 * session when email verification is required.
 */
export interface AuthMutationResultDto {
  message?: string;
  requiresEmailVerification?: boolean;
  session?: AuthSessionDto;
  user?: AuthUser;
}

/**
 * Payload accepted when registering a first-party credentials account.
 */
export interface AuthRegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Payload accepted by credentials-based login endpoints.
 */
export interface AuthLoginInput {
  email: string;
  password: string;
}

/** Credentials accepted by the development-only login endpoint. */
export type AuthDevLoginInput = AuthLoginInput;

/**
 * Payload accepted when completing email verification with a one-time code.
 */
export interface AuthVerifyEmailInput {
  otp: string;
}

/**
 * Payload accepted when requesting a password-reset email.
 */
export interface AuthForgotPasswordInput {
  email: string;
}

/**
 * Payload accepted when setting a new password with a reset token.
 */
export interface AuthResetPasswordInput {
  token: string;
  password: string;
}

/**
 * Request used by browser clients to start a social authorization redirect.
 */
export interface AuthSocialAuthorizationRequestDto {
  intent?: AuthFlowIntent;
  provider: AuthSocialProvider;
  returnTo?: string;
}

/**
 * Response returned after the backend creates a social authorization URL.
 */
export interface AuthSocialAuthorizationResultDto {
  authorizationUrl: string;
}

/**
 * Normalized identity-provider profile consumed by auth account linking.
 *
 * Providers do not expose identical profile fields; optional fields represent
 * data that may be missing from an OAuth response or withheld by provider
 * privacy settings.
 */
export interface AuthProviderProfile {
  avatarUrl?: string;
  displayName: string;
  email?: string;
  emailVerified: boolean;
  provider: AuthIdentityProvider;
  subject: string;
  username?: string;
}
