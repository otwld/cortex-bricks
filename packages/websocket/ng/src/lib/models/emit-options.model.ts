/**
 * Per-call options for `WsClient.emitWithAck`.
 */
export interface EmitOptions {
  /** Override the configured default ack timeout. */
  timeoutMs?: number;
}
