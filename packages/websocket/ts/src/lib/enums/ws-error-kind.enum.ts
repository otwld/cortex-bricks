/**
 * Categorizes the runtime error surface produced by the websocket libs.
 *
 * Stable identifiers; safe to send across the wire as part of error payloads.
 */
export enum WsErrorKind {
  /** Incoming envelope's pattern did not match the expected one. */
  PatternMismatch = 'PATTERN_MISMATCH',
  /** Inbound payload failed zod validation. */
  InvalidPayload = 'INVALID_PAYLOAD',
  /** Outbound ack/response failed zod validation before send. */
  InvalidResponse = 'INVALID_RESPONSE',
  /** A `emitWithAck` request did not receive an ack within the timeout. */
  AckTimeout = 'ACK_TIMEOUT',
  /** Authentication failed at handshake or during a reauth. */
  Unauthorized = 'UNAUTHORIZED',
  /** Underlying transport (network, socket.io) emitted an error. */
  Transport = 'TRANSPORT',
}
