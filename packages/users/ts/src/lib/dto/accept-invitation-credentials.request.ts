/** Request body accepted by invitation credential setup. */
export interface AcceptInvitationCredentialsRequest {
  /** Optional local username selected by the invited user. */
  username?: string;
  /** Password selected by the invited user. */
  password: string;
}

/** Request body accepted by invitation OAuth completion. */
export interface CompleteInvitationOAuthRequest {
  /** Raw OAuth state generated when the invitation OAuth flow started. */
  state: string;
}
