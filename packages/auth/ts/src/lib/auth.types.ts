import type { UserPermission, UserRole } from '@otwld/ts-users';

export const AUTH_SOCIAL_PROVIDERS = ['google', 'github'] as const;
export type AuthSocialProvider = (typeof AUTH_SOCIAL_PROVIDERS)[number];

export const AUTH_IDENTITY_PROVIDERS = [
  'credentials',
  ...AUTH_SOCIAL_PROVIDERS,
] as const;
export type AuthIdentityProvider = (typeof AUTH_IDENTITY_PROVIDERS)[number];

export const AUTH_FLOW_INTENTS = ['login', 'register'] as const;
export type AuthFlowIntent = (typeof AUTH_FLOW_INTENTS)[number];

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

export interface AuthSessionDto {
  authenticated: boolean;
  expiresAt?: string | null;
  user: AuthUser | null;
}

export interface AuthMutationResultDto {
  message?: string;
  requiresEmailVerification?: boolean;
  session?: AuthSessionDto;
  user?: AuthUser;
}

export interface AuthRegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthLoginInput {
  email: string;
  password: string;
}

/** Credentials accepted by the development-only login endpoint. */
export type AuthDevLoginInput = AuthLoginInput;

export interface AuthVerifyEmailInput {
  otp: string;
}

export interface AuthForgotPasswordInput {
  email: string;
}

export interface AuthResetPasswordInput {
  token: string;
  password: string;
}

export interface AuthSocialAuthorizationRequestDto {
  intent?: AuthFlowIntent;
  provider: AuthSocialProvider;
  returnTo?: string;
}

export interface AuthSocialAuthorizationResultDto {
  authorizationUrl: string;
}

export interface AuthProviderProfile {
  avatarUrl?: string;
  displayName: string;
  email?: string;
  emailVerified: boolean;
  provider: AuthIdentityProvider;
  subject: string;
  username?: string;
}
