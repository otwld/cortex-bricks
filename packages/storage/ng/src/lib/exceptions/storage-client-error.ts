/** Client-side storage error codes. */
export enum StorageClientErrorCode {
  /** Upload was attempted outside a browser runtime. */
  NOT_BROWSER = 'NOT_BROWSER',
  /** File failed client-side validation. */
  INVALID_FILE = 'INVALID_FILE',
  /** Signed URL request failed. */
  SIGNED_URL_FAILED = 'SIGNED_URL_FAILED',
  /** Upload was cancelled by the caller. */
  CANCELLED = 'CANCELLED',
}

/** Error thrown by Angular storage client services. */
export class StorageClientError extends Error {
  /**
   * Create a client-side storage error.
   *
   * @param code - Stable client error code.
   * @param message - Human-readable failure message.
   * @param cause - Lower-level error that triggered this failure.
   */
  constructor(
    readonly code: StorageClientErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'StorageClientError';
  }
}
