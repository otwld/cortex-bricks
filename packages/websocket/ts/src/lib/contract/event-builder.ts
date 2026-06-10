import type { ZodType } from 'zod';
import { WsErrorKind } from '../enums/ws-error-kind.enum';
import { WsValidationError } from '../errors/ws-validation-error';
import type { ClientEventDef, ServerEventDef } from './event-def';

/**
 * Validate `input` against `schema`, throwing `WsValidationError` on failure.
 *
 * @param input Unknown value to validate.
 * @param schema Zod schema to validate against.
 * @param kind Error kind to attach if validation fails.
 * @param pattern Event pattern for diagnostics.
 */
function safeParse<T>(
  input: unknown,
  schema: ZodType<T>,
  kind: WsErrorKind.InvalidPayload | WsErrorKind.InvalidResponse,
  pattern: string,
): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new WsValidationError({
      kind,
      pattern,
      message: `${kind === WsErrorKind.InvalidPayload ? 'Payload' : 'Response'} validation failed for "${pattern}"`,
      issues: result.error.issues,
    });
  }
  return result.data;
}

/**
 * Final builder stage for client events after a payload schema is attached.
 *
 * @typeParam TPattern Literal pattern string.
 * @typeParam TPayload Inferred payload type.
 */
interface ClientEventDefBuilder<TPattern extends string, TPayload> {
  /**
   * Attach a response schema, making this event ack-able.
   *
   * @param schema Zod schema for the ack payload.
   */
  response<TResponse>(schema: ZodType<TResponse>): {
    /** Finalize the ack-able definition. */
    build(): ClientEventDef<TPattern, TPayload, TResponse>;
  };

  /** Finalize the definition without a response schema. */
  build(): ClientEventDef<TPattern, TPayload, void>;
}

/**
 * Initial builder stage for client events.
 *
 * @typeParam TPattern Literal pattern string.
 */
interface ClientEventDefInit<TPattern extends string> {
  /**
   * Attach a payload schema.
   *
   * @param schema Zod schema for the inbound payload.
   */
  payload<TPayload>(schema: ZodType<TPayload>): ClientEventDefBuilder<TPattern, TPayload>;
}

/**
 * Build a Client to Server event definition.
 *
 * @param pattern Wire-level pattern string.
 */
export function clientEvent<const TPattern extends string>(
  pattern: TPattern,
): ClientEventDefInit<TPattern> {
  return {
    payload<TPayload>(payloadSchema: ZodType<TPayload>) {
      return {
        response<TResponse>(responseSchema: ZodType<TResponse>) {
          return {
            build(): ClientEventDef<TPattern, TPayload, TResponse> {
              return {
                direction: 'c2s',
                pattern,
                payloadSchema,
                responseSchema,
                parse(input) {
                  return safeParse(input, payloadSchema, WsErrorKind.InvalidPayload, pattern);
                },
                parseResponse(input) {
                  return safeParse(input, responseSchema, WsErrorKind.InvalidResponse, pattern);
                },
              };
            },
          };
        },
        build(): ClientEventDef<TPattern, TPayload, void> {
          return {
            direction: 'c2s',
            pattern,
            payloadSchema,
            parse(input) {
              return safeParse(input, payloadSchema, WsErrorKind.InvalidPayload, pattern);
            },
            parseResponse() {
              return undefined;
            },
          };
        },
      };
    },
  };
}

/**
 * Initial builder stage for server events.
 *
 * @typeParam TPattern Literal pattern string.
 */
interface ServerEventDefInit<TPattern extends string> {
  /**
   * Attach a payload schema.
   *
   * @param schema Zod schema for the outbound payload.
   */
  payload<TPayload>(schema: ZodType<TPayload>): {
    /** Finalize the definition. */
    build(): ServerEventDef<TPattern, TPayload>;
  };
}

/**
 * Build a Server to Client event definition.
 *
 * @param pattern Wire-level pattern string.
 */
export function serverEvent<const TPattern extends string>(
  pattern: TPattern,
): ServerEventDefInit<TPattern> {
  return {
    payload<TPayload>(payloadSchema: ZodType<TPayload>) {
      return {
        build(): ServerEventDef<TPattern, TPayload> {
          return {
            direction: 's2c',
            pattern,
            payloadSchema,
            parse(input) {
              return safeParse(input, payloadSchema, WsErrorKind.InvalidPayload, pattern);
            },
          };
        },
      };
    },
  };
}
