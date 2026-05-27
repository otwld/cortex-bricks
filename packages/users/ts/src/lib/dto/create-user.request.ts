import { UserAccountStatus } from '../enums/user-account-status.enum';
import { UserEmploymentType } from '../enums/user-employment-type.enum';
import { UserGender } from '../enums/user-gender.enum';
import { UserPermission } from '../models/user-permission.model';
import { UserRole } from '../models/user-role.model';

/** Request body accepted by POST /api/users. */
export interface CreateUserRequest {
  /** Email for the linked auth account and invitation. */
  email: string;
  /** Optional local username reserved during invitation. */
  username?: string;
  /** Optional given name. */
  firstName?: string;
  /** Optional family name. */
  lastName?: string;
  /** Display name shown in dashboard UI. */
  displayName: string;
  /** Optional profile biography. */
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
  /** Whether the user works hybrid. */
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
  /** Roles assigned to the linked auth account. */
  roles: UserRole[];
  /** Direct permissions assigned to the linked auth account. */
  permissions: UserPermission[];
  /** Whether to send or queue the invitation email. */
  sendInvitation: boolean;
  /** Optional internal admin note. */
  internalNotes?: string;
}
