import type { z, ZodType } from 'zod';

/**
 * Definition for a Client to Server event.
 *
 * @typeParam TPattern Literal pattern string (compile-time identifier).
 * @typeParam TPayload Inbound payload type (inferred from `payloadSchema`).
 * @typeParam TResponse Optional ack response type. `void` means no response.
 */
export interface ClientEventDef<
  TPattern extends string = string,
  TPayload = unknown,
  TResponse = void,
> {
  /** Discriminator. */
  readonly direction: 'c2s';

  /** Wire-level pattern string. */
  readonly pattern: TPattern;

  /** Zod schema used to validate inbound payloads. */
  readonly payloadSchema: ZodType<TPayload>;

  /** Optional zod schema used to validate outbound ack responses. */
  readonly responseSchema?: ZodType<TResponse>;

  /**
   * Validate an unknown value as a payload. Throws `WsValidationError` on
   * failure.
   *
   * @param input Unknown value received over the wire.
   */
  parse(input: unknown): TPayload;

  /**
   * Validate an unknown value as an ack response. Throws `WsValidationError`
   * on failure. Returns `undefined` when no response schema is configured.
   *
   * @param input Unknown value to validate.
   */
  parseResponse(input: unknown): TResponse;
}

/**
 * Definition for a Server to Client event (one-way broadcast).
 *
 * @typeParam TPattern Literal pattern string.
 * @typeParam TPayload Outbound payload type (inferred from `payloadSchema`).
 */
export interface ServerEventDef<TPattern extends string = string, TPayload = unknown> {
  /** Discriminator. */
  readonly direction: 's2c';

  /** Wire-level pattern string. */
  readonly pattern: TPattern;

  /** Zod schema used to validate the payload. */
  readonly payloadSchema: ZodType<TPayload>;

  /**
   * Validate an unknown value as a payload. Throws `WsValidationError` on
   * failure.
   *
   * @param input Unknown value received over the wire.
   */
  parse(input: unknown): TPayload;
}

/**
 * Convenience union of all event definition shapes.
 */
export type AnyEventDef =
  | ClientEventDef<string, unknown, unknown>
  | ServerEventDef<string, unknown>;

/**
 * Helper that extracts the inferred payload type from any event def.
 */
export type PayloadOf<TDef> =
  TDef extends ClientEventDef<string, infer P, unknown>
    ? P
    : TDef extends ServerEventDef<string, infer P>
      ? P
      : never;

/**
 * Helper that extracts the inferred response type from a `ClientEventDef`.
 */
export type ResponseOf<TDef> = TDef extends ClientEventDef<string, unknown, infer R> ? R : never;

/**
 * Helper that extracts the literal pattern string from any event def.
 */
export type PatternOf<TDef> =
  TDef extends ClientEventDef<infer P, unknown, unknown>
    ? P
    : TDef extends ServerEventDef<infer P, unknown>
      ? P
      : never;

export type { z };
