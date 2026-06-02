import type { WsAuthAdapter } from '../services/ws-auth.adapter';
import type { EmitOptions } from './emit-options.model';
import type { ReconnectStrategy } from './reconnect-strategy.model';

/**
 * Configuration for `provideWebsocket` / `WsClient`.
 */
export interface WsConfig {
  /** Server origin. */
  url: string;
  /** Auth wiring. */
  auth?: {
    /** Pre-built adapter instance. */
    adapter: WsAuthAdapter;
    /** Retry handshake on connect-error. */
    reauthOnConnectError?: boolean;
  };
  /** Reconnection strategy. */
  reconnect?: ReconnectStrategy;
  /** Default timeout for `emitWithAck`. */
  defaultAckTimeoutMs?: number;
  /** Emit defaults applied when omitted. */
  defaultEmitOptions?: EmitOptions;
  /** Whether to connect on construction. Defaults to true. */
  autoConnect?: boolean;
  /** Socket.IO transports. */
  transports?: ReadonlyArray<'websocket' | 'polling'>;
  /** Optional logger. */
  logger?: { error: (...args: unknown[]) => void; log?: (...args: unknown[]) => void };
}

/**
 * Defaults applied when fields are omitted from `WsConfig`.
 */
export const DEFAULT_RECONNECT_STRATEGY: ReconnectStrategy = {
  attempts: Infinity,
  initialDelayMs: 500,
  maxDelayMs: 30_000,
  backoffFactor: 2,
  jitter: 0.2,
};
