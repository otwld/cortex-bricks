/**
 * Subset of `UserContext` exposed to the client during presence broadcasts.
 */
export interface UserContextSnapshot {
  /** Stable user id. */
  readonly id: string;
}
