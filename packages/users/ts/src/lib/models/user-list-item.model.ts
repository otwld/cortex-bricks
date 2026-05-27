import { UserProfile } from './user-profile.model';

/** List row shape for dashboard user-management tables. */
export type UserListItem = Pick<
  UserProfile,
  | 'id'
  | 'authUserId'
  | 'email'
  | 'username'
  | 'firstName'
  | 'lastName'
  | 'displayName'
  | 'avatar'
  | 'department'
  | 'position'
  | 'accountStatus'
  | 'invitationStatus'
  | 'emailVerified'
  | 'roles'
  | 'permissions'
  | 'createdAt'
  | 'updatedAt'
  | 'lastLoginAt'
>;
