/**
 * Frozen view of a Socket.IO handshake, passed to `WsAuthAdapter.authenticate`.
 *
 * Contains every input source a typical auth strategy needs: headers, query
 * string, parsed cookies, the `auth` payload, and the remote address.
 */
export interface HandshakeContext {
  /** Lower-cased HTTP headers from the upgrade request. */
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;

  /** Parsed query-string parameters from the connection URL. */
  readonly query: Readonly<Record<string, string | string[] | undefined>>;

  /** Parsed cookies. Empty object if no cookies were sent. */
  readonly cookies: Readonly<Record<string, string>>;

  /** Application-defined `auth` payload from the client `io({ auth })` call. */
  readonly auth: Readonly<Record<string, unknown>>;

  /** Remote IP address of the connecting client. */
  readonly address: string;
}
