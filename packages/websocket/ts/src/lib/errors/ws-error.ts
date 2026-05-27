import { WsErrorKind } from '../enums/ws-error-kind.enum';

/**
 * Constructor arguments for `WsError`.
 */
export interface WsErrorArgs {
  /** Categorical kind of the error. */
  kind: WsErrorKind;
  /** Human-readable description. */
  message: string;
  /** Optional event pattern this error relates to. */
  pattern?: string;
  /** Optional structured details (e.g., zod issues, transport diagnostics). */
  details?: unknown;
}

/**
 * Base class for all errors raised by the websocket libraries.
 *
 * Carries a typed `kind` for branching and an optional `pattern` plus
 * `details` payload for diagnostics.
 */
export class WsError extends Error {
  /** Categorical kind of the error. */
  public readonly kind: WsErrorKind;

  /** Optional event pattern this error relates to. */
  public readonly pattern?: string;

  /** Optional structured details. */
  public readonly details?: unknown;

  /**
   * @param args Error arguments: kind, message, and optional metadata.
   */
  public constructor(args: WsErrorArgs) {
    super(args.message);
    this.name = WsError.name;
    this.kind = args.kind;
    this.pattern = args.pattern;
    this.details = args.details;
  }
}
