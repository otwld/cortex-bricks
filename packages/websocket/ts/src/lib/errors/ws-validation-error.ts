import type { ZodIssue } from 'zod';
import { WsErrorKind } from '../enums/ws-error-kind.enum';
import { WsError } from './ws-error';

/**
 * Constructor arguments for `WsValidationError`.
 */
export interface WsValidationErrorArgs {
  /** Either `InvalidPayload` (incoming) or `InvalidResponse` (outgoing). */
  kind: WsErrorKind.InvalidPayload | WsErrorKind.InvalidResponse;
  /** Human-readable description. */
  message: string;
  /** Optional event pattern this error relates to. */
  pattern?: string;
  /** Flattened zod issues that caused the failure. */
  issues: readonly ZodIssue[];
}

/**
 * Raised when an inbound payload or outbound response fails zod validation.
 *
 * Always carries the original `ZodIssue[]` so consumers can render targeted
 * field-level error messages.
 */
export class WsValidationError extends WsError {
  /** Flattened zod issues that caused the failure. */
  public readonly issues: readonly ZodIssue[];

  /**
   * @param args Validation error arguments.
   */
  public constructor(args: WsValidationErrorArgs) {
    super({
      kind: args.kind,
      message: args.message,
      pattern: args.pattern,
      details: { issues: args.issues },
    });
    this.name = WsValidationError.name;
    this.issues = args.issues;
  }
}
