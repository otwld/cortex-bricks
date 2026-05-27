/** Role assigned to a user account. */
export interface UserRole {
  /** Role name used by authorization checks. */
  name: string;
  /** Permission strings granted by this role. */
  permissions: string[];
}
