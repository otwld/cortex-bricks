/**
 * Lifecycle states for a WebSocket client connection.
 *
 * Drives the `WsClient.state` signal on the Angular client and the
 * connection-context bookkeeping on the NestJS server.
 */
export enum ConnectionState {
  /** No connection has been attempted yet, or has been closed. */
  Disconnected = 'disconnected',
  /** A connection attempt is in progress for the first time. */
  Connecting = 'connecting',
  /** Connection is established and ready to send/receive events. */
  Connected = 'connected',
  /** Connection was lost; the reconnect controller is retrying. */
  Reconnecting = 'reconnecting',
  /** The client was explicitly disconnected and will not auto-reconnect. */
  Closed = 'closed',
}
