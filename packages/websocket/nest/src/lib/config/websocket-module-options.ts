import type { Type } from '@nestjs/common';
import { z } from 'zod';
import type { WsAuthAdapter } from '../adapters/ws-auth-adapter';
import type { WsScalingAdapter } from '../adapters/ws-scaling-adapter';

/**
 * CORS configuration accepted by the websocket module.
 */
export interface WebsocketCorsOptions {
  /** Allowed origin or origins. */
  origin: string | readonly string[] | '*';
  /** Whether to expose `Access-Control-Allow-Credentials`. Defaults to false. */
  credentials?: boolean;
}

/**
 * Presence subsystem configuration.
 */
export interface WebsocketPresenceOptions {
  /** When true the lib emits a synthetic event on join/leave. Defaults to true. */
  autoBroadcast?: boolean;
  /** Event name used for synthetic broadcasts. Defaults to `presence:update`. */
  eventName?: string;
}

/**
 * Logger configuration.
 */
export interface WebsocketLoggerOptions {
  /** Log level threshold. Defaults to `log`. */
  level?: 'verbose' | 'debug' | 'log' | 'warn' | 'error';
}

/**
 * Module-level options consumed by `WebsocketModule.forRoot`.
 */
export interface WebsocketModuleOptions {
  /** CORS configuration applied to the underlying Socket.IO engine. */
  cors?: WebsocketCorsOptions;
  /** Class implementing `WsAuthAdapter`. Constructed through Nest DI. */
  authAdapter: Type<WsAuthAdapter>;
  /** Pre-built scaling adapter instance. Defaults to a no-op single-instance adapter. */
  scalingAdapter?: WsScalingAdapter;
  /** Default ack timeout in ms. Defaults to 10000. */
  defaultAckTimeoutMs?: number;
  /** Whether outgoing emits are zod-validated. Defaults to true. */
  validateOutgoingPayloads?: boolean;
  /** Presence subsystem options. */
  presence?: WebsocketPresenceOptions;
  /** Logger options. */
  logger?: WebsocketLoggerOptions;
}

/** Internal zod schema used to validate options at module registration. */
export const websocketModuleOptionsSchema = z.object({
  cors: z
    .object({
      origin: z.union([z.string(), z.array(z.string()).readonly(), z.literal('*')]),
      credentials: z.boolean().optional(),
    })
    .optional(),
  authAdapter: z.custom<Type<WsAuthAdapter>>((value) => typeof value === 'function', {
    message: 'authAdapter must be a class',
  }),
  scalingAdapter: z.custom<WsScalingAdapter>().optional(),
  defaultAckTimeoutMs: z.number().int().positive().default(10_000),
  validateOutgoingPayloads: z.boolean().default(true),
  presence: z
    .object({
      autoBroadcast: z.boolean().default(true),
      eventName: z.string().min(1).default('presence:update'),
    })
    .default({}),
  logger: z
    .object({
      level: z.enum(['verbose', 'debug', 'log', 'warn', 'error']).default('log'),
    })
    .default({}),
});

/**
 * Parsed options shape with all defaults applied.
 */
export type ResolvedWebsocketModuleOptions = z.output<typeof websocketModuleOptionsSchema>;

/**
 * Validate raw options at module registration.
 *
 * @param options Raw user options.
 */
export function resolveWebsocketModuleOptions(
  options: WebsocketModuleOptions,
): ResolvedWebsocketModuleOptions {
  const result = websocketModuleOptionsSchema.safeParse(options);
  if (!result.success) {
    throw new Error(
      `WebsocketModule: invalid options: ${result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ')}`,
    );
  }
  return result.data;
}
