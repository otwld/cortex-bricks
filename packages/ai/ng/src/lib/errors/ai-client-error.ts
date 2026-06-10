import { AiErrorCode } from '@otwld/ts-ai';

/** Client-side AI error carrying a stable shared error code. */
export class AiClientError extends Error {
  /**
   * Create a client-side AI error.
   *
   * @param code - Stable shared AI error code.
   * @param message - Human-readable failure message.
   * @param cause - Lower-level error that triggered this failure.
   */
  constructor(
    readonly code: AiErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AiClientError';
  }
}
