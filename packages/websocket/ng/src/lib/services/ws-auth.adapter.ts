/**
 * Pluggable client-side authentication adapter.
 */
export abstract class WsAuthAdapter {
  /** Resolve the current bearer token. */
  /**
   * Runs get token.
   *
   * @returns The ws auth adapter get token result.
   */
  public abstract getToken(): string | null | Promise<string | null>;

  /**
   * Decide what to do when the socket emits `connect_error`.
   *
   * @param error Connect error.
   */
  /**
   * Runs on connect error.
   *
   * @param error - error value.
   *
   * @returns The ws auth adapter on connect error result.
   */
  public onConnectError?(error: Error): 'retry' | 'logout' | 'silent';

  /** Triggered when the server signals token expiry. */
  public onReauthRequired?(): Promise<void>;
}
