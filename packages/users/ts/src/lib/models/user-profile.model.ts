import { UserAccountStatus } from '../enums/user-account-status.enum';
import { UserEmploymentType } from '../enums/user-employment-type.enum';
import { UserGender } from '../enums/user-gender.enum';
import { UserInvitationStatus } from '../enums/user-invitation-status.enum';
import { UserPermission } from './user-permission.model';
import { UserRole } from './user-role.model';

/** Full safe user profile returned by user-management endpoints. */
export interface UserProfile {
  /** Stable profile identifier. */
  id: string;
  /** Linked auth account identifier. */
  authUserId: string;
  /** Login and invitation email. */
  email: string;
  /** Optional local username. */
  username?: string;
  /** Optional given name. */
  firstName?: string;
  /** Optional family name. */
  lastName?: string;
  /** Display name shown in user-management UI. */
  displayName: string;
  /** Optional biography. */
  bio?: string;
  /** Optional avatar URL. */
  avatar?: string;
  /** Optional gender. */
  gender?: UserGender;
  /** Optional phone number. */
  phone?: string;
  /** Optional department label. */
  department?: string;
  /** Optional position title. */
  position?: string;
  /** Optional employment type. */
  employmentType?: UserEmploymentType;
  /** Whether the user follows a hybrid work pattern. */
  hybridWork?: boolean;
  /** Optional office location. */
  officeLocation?: string;
  /** Optional country code or label. */
  country?: string;
  /** Optional region or state. */
  region?: string;
  /** Optional city. */
  city?: string;
  /** Optional postal code. */
  postalCode?: string;
  /** Optional primary address line. */
  addressLine1?: string;
  /** Optional secondary address line. */
  addressLine2?: string;
  /** Business account status. */
  accountStatus: UserAccountStatus;
  /** Current invitation status. */
  invitationStatus: UserInvitationStatus;
  /** Whether the linked auth account email is verified. */
  emailVerified: boolean;
  /** Roles assigned to the linked auth account. */
  roles: UserRole[];
  /** Direct permissions assigned to the linked auth account. */
  permissions: UserPermission[];
  /** Optional internal admin note. */
  internalNotes?: string;
  /** ISO timestamp for profile creation. */
  createdAt: string;
  /** ISO timestamp for profile update. */
  updatedAt: string;
  /** ISO timestamp for last auth login. */
  lastLoginAt?: string;
  /** ISO timestamp for most recent invitation. */
  invitedAt?: string;
  /** ISO timestamp for accepted invitation. */
  invitationAcceptedAt?: string;
}
