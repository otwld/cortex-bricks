import type { PipeTransform } from '@nestjs/common';
import {
  WsErrorKind,
  WsValidationError,
  type AnyEventDef,
} from '@otwld/ts-websocket';
import { WsValidationException } from '../exceptions/ws-validation.exception';

/**
 * Validates an incoming WebSocket payload against an event definition.
 *
 * @typeParam TPayload Inferred payload type of the event definition.
 */
export class ZodPayloadPipe<TPayload = unknown> implements PipeTransform<unknown, TPayload> {
  /**
   * @param def Event definition whose `payloadSchema` is used.
   */
  public constructor(private readonly def: AnyEventDef) {}

  /**
   * Transform and validate the raw websocket payload.
   *
   * @param value Raw value received from the client.
   */
  public transform(value: unknown): TPayload {
    try {
      return this.def.parse(value) as TPayload;
    } catch (err) {
      if (err instanceof WsValidationError) {
        throw new WsValidationException({
          kind: WsErrorKind.InvalidPayload,
          message: err.message,
          pattern: err.pattern,
          issues: err.issues,
        });
      }
      throw err;
    }
  }
}
