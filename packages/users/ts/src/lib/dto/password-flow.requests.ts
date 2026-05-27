/** Request body accepted by current-user password changes. */
export interface ChangeUserPasswordRequest {
  /** Current plain-text password. */
  currentPassword: string;
  /** Replacement plain-text password. */
  newPassword: string;
}

/** Request body accepted by password reset request endpoints. */
export interface RequestUserPasswordResetRequest {
  /** Email address for the account requesting a reset. */
  email: string;
}

/** Request body accepted by password reset completion endpoints. */
export interface ResetUserPasswordRequest {
  /** Raw password reset token. */
  token: string;
  /** Replacement plain-text password. */
  password: string;
}
