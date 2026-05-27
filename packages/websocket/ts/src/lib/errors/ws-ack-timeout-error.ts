import { WsErrorKind } from '../enums/ws-error-kind.enum';
import { WsError } from './ws-error';

/**
 * Constructor arguments for `WsAckTimeoutError`.
 */
export interface WsAckTimeoutErrorArgs {
  /** Event pattern that did not receive an ack. */
  pattern: string;
  /** Timeout in milliseconds that elapsed without a response. */
  timeoutMs: number;
}

/**
 * Raised when a `emitWithAck` request does not receive a response within the
 * configured timeout.
 */
export class WsAckTimeoutError extends WsError {
  /** Timeout in milliseconds that elapsed without a response. */
  public readonly timeoutMs: number;

  /**
   * @param args Timeout error arguments.
   */
  public constructor(args: WsAckTimeoutErrorArgs) {
    super({
      kind: WsErrorKind.AckTimeout,
      message: `Ack for "${args.pattern}" did not arrive within ${args.timeoutMs}ms`,
      pattern: args.pattern,
    });
    this.name = WsAckTimeoutError.name;
    this.timeoutMs = args.timeoutMs;
  }
}
