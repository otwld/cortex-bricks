import type { NestFeatureModuleClassAsyncOptions } from '@otwld/nest-sdk';

/** Parameters passed when a user-management password reset token is generated. */
export interface UsersMailPasswordResetRequestedParams {
  /** Account email receiving the reset link. */
  email: string;
  /** Human-readable recipient name. */
  name: string;
  /** Raw reset token to embed in the reset link. */
  resetToken: string;
  /** Token expiry timestamp. */
  expiresAt: Date;
}

/** Parameters passed after a user-management password reset succeeds. */
export interface UsersMailPasswordResetParams {
  /** Account email receiving the confirmation. */
  email: string;
  /** Human-readable recipient name. */
  name: string;
}

/** Parameters passed when an invitation link is generated. */
export interface UsersMailInvitationParams {
  /** Account email receiving the invitation. */
  email: string;
  /** Human-readable recipient name. */
  name: string;
  /** Public invitation URL. */
  invitationUrl: string;
  /** Invitation expiry timestamp. */
  expiresAt: Date;
}

/** Mail callbacks used by the users domain. */
export interface UsersModuleMailOptions {
  /** Called after an invitation link is generated. */
  onInvitationCreated?: (params: UsersMailInvitationParams) => Promise<void>;
  /** Called after a reset token is generated for an existing user. */
  onPasswordResetRequested?: (params: UsersMailPasswordResetRequestedParams) => Promise<void>;
  /** Called after a password reset succeeds. */
  onPasswordReset?: (params: UsersMailPasswordResetParams) => Promise<void>;
}

/** Runtime configuration for the reusable users module. */
export interface UsersModuleOptions {
  /** Public frontend origin used for invitation and reset links. */
  frontendUrl?: string;
  /** Optional users-domain mail callbacks. */
  mail?: UsersModuleMailOptions;
}

/** Factory interface for async users module configuration. */
export interface UsersModuleOptionsFactory {
  createUsersOptions(): Promise<UsersModuleOptions> | UsersModuleOptions;
}

/** Async configuration shape for UsersModule. */
export type UsersModuleAsyncOptions = NestFeatureModuleClassAsyncOptions<
  UsersModuleOptions,
  UsersModuleOptionsFactory
>;

/** Injection token for users module options. */
export const USERS_MODULE_OPTIONS = Symbol('USERS_MODULE_OPTIONS');
