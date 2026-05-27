import { UserInvitationStatus } from '../enums/user-invitation-status.enum';

/** Provider choices displayed on the invitation acceptance page. */
export type UserInvitationProvider = 'credentials' | 'google' | 'github';

/** Delivery state for a generated invitation link. */
export type UserInvitationDeliveryStatus = 'not-requested' | 'sent' | 'failed';

/** Invitation link and delivery result returned to authorized admins. */
export interface UserInvitationResult {
  /** Link the invited user can open to accept the invitation. */
  link: string;
  /** ISO expiry timestamp for the generated invitation. */
  expiresAt: string;
  /** Email delivery state for the generated invitation. */
  deliveryStatus: UserInvitationDeliveryStatus;
}

/** Safe invitation details returned before account setup. */
export interface UserInvitationDetails {
  /** Invitation email. */
  email: string;
  /** Display name for the invited user. */
  displayName: string;
  /** Current invitation state. */
  status: UserInvitationStatus;
  /** ISO expiry timestamp. */
  expiresAt: string;
  /** Allowed setup methods. */
  availableProviders: UserInvitationProvider[];
}
