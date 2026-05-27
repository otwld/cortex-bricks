import { AiErrorCode } from '@otwld/ts-ai';

/**
 * Provides ai client error behavior.
 */
export class AiClientError extends Error {
  /**
   * Creates a ai client error instance.
   *
   * @param code - code value.
   *
   * @param message - message value.
   *
   * @param cause - cause value.
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
