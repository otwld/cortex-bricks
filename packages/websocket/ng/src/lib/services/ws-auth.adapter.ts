/**
 * Pluggable client-side authentication adapter.
 */
export abstract class WsAuthAdapter {
  /** Resolve the current bearer token. */
  public abstract getToken(): string | null | Promise<string | null>;

  /**
   * Decide what to do when the socket emits `connect_error`.
   *
   * @param error Connect error.
   */
  public onConnectError?(error: Error): 'retry' | 'logout' | 'silent';

  /** Triggered when the server signals token expiry. */
  public onReauthRequired?(): Promise<void>;
}
