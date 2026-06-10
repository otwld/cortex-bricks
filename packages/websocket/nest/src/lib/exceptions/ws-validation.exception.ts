import { WsException } from '@nestjs/websockets';
import {
  WsErrorKind,
  WsValidationError,
  type WsValidationErrorArgs,
} from '@otwld/ts-websocket';

/**
 * Nest-side equivalent of `WsValidationError`.
 */
export class WsValidationException extends WsException {
  /** Underlying validation error. */
  public readonly validationError: WsValidationError;

  /**
   * @param args Validation error arguments.
   */
  public constructor(args: WsValidationErrorArgs) {
    const error = new WsValidationError(args);
    super({
      kind: error.kind,
      pattern: error.pattern,
      message: error.message,
      issues: error.issues,
    });
    this.validationError = error;
  }

  /** Convenience accessor for the error kind. */
  public get kind(): WsErrorKind {
    return this.validationError.kind;
  }
}
