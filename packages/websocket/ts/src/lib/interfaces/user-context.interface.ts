/**
 * Authenticated user context attached to a websocket connection.
 *
 * Generic over `TClaims` so consumers can narrow the claims shape via
 * module augmentation if they want strongly typed JWT contents.
 *
 * @typeParam TClaims Shape of the claims dictionary attached to this user.
 */
export interface UserContext<TClaims = Record<string, unknown>> {
  /** Stable identifier for the authenticated principal. */
  readonly id: string;

  /** Arbitrary claims (e.g., decoded JWT payload). */
  readonly claims: TClaims;

  /** Wall-clock instant the auth adapter validated this user. */
  readonly authenticatedAt: Date;
}
