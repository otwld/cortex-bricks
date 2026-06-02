/**
 * Exponential-backoff reconnection strategy with optional jitter.
 */
export interface ReconnectStrategy {
  /** Max number of reconnect attempts. */
  attempts: number;
  /** First retry delay in ms. */
  initialDelayMs: number;
  /** Cap on retry delay. */
  maxDelayMs: number;
  /** Multiplier between attempts. */
  backoffFactor: number;
  /** Jitter ratio from 0 to 1. */
  jitter: number;
}
