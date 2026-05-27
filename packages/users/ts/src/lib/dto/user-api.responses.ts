import { UserInvitationDetails, UserInvitationResult } from '../models/user-invitation.model';
import { UserListItem } from '../models/user-list-item.model';
import { UserProfile } from '../models/user-profile.model';

/** Response returned by invitation acceptance. */
export interface AcceptInvitationResponse {
  /** Whether the invitation is accepted. */
  accepted: boolean;
  /** Safe profile for the accepted invitation. */
  user: UserProfile;
}

/** Response returned by GET /api/users. */
export interface ListUsersResponse {
  /** User rows. */
  users: UserListItem[];
}

/** Response returned by invitation detail endpoint. */
export interface UserInvitationResponse {
  /** Safe invitation details. */
  invitation: UserInvitationDetails;
}

/** Response returned by user profile write endpoints. */
export interface UserProfileResponse {
  /** Safe user profile. */
  user: UserProfile;
  /** Fresh invitation result returned when an invitation link is generated. */
  invitation?: UserInvitationResult;
  /** Whether invitation delivery succeeded. */
  invitationSent?: boolean;
  /** Invitation link returned to authorized admins when a fresh invitation is generated. */
  invitationLink?: string;
  /** ISO expiry timestamp for the generated invitation. */
  invitationExpiresAt?: string;
}

/** Response returned by password workflow endpoints. */
export interface PasswordFlowResponse {
  /** Whether a password reset was requested without revealing account existence. */
  requested?: boolean;
  /** Whether the current user's password changed. */
  changed?: boolean;
  /** Whether a reset-token password change completed. */
  reset?: boolean;
}
