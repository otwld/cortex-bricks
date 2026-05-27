import type { Socket } from 'socket.io';
import type { HandshakeContext, RoomId, UserContext } from '@otwld/ts-websocket';

/** Per-socket state attached by the connection lifecycle handler. */
export interface ConnectionContextData {
  /** Authenticated user context, if any. */
  user?: UserContext;
  /** Wall-clock instant at which the auth token expires. */
  tokenExpiresAt?: Date;
  /** Pending timeout handle for reauth/expiration. */
  reauthTimer?: ReturnType<typeof setTimeout>;
}

/**
 * Minimal lifecycle delegate used by typed gateway prototype hooks.
 */
export interface WebsocketLifecycleDelegate {
  /** Run gateway initialization for a Socket.IO server or namespace. */
  handleInit(server: unknown, gateway?: object): Promise<void>;
  /** Run connection handling for a socket and gateway instance. */
  handleConnection(socket: Socket, gateway?: object): Promise<void>;
  /** Run disconnect handling for a socket and gateway instance. */
  handleDisconnect(socket: Socket, gateway?: object): Promise<void>;
}

let lifecycleDelegate: WebsocketLifecycleDelegate | undefined;

/**
 * Register the process-local websocket lifecycle delegate.
 *
 * @param delegate Active lifecycle delegate.
 */
export function setWebsocketLifecycleDelegate(delegate: WebsocketLifecycleDelegate): void {
  lifecycleDelegate = delegate;
}

/**
 * Read the process-local websocket lifecycle delegate.
 */
export function getWebsocketLifecycleDelegate(): WebsocketLifecycleDelegate | undefined {
  return lifecycleDelegate;
}

/**
 * Read or initialize the per-socket context attached to `socket.data.context`.
 *
 * @param socket Socket.IO socket.
 */
export function getConnectionContext(socket: Socket): ConnectionContextData {
  const data = socket.data as { context?: ConnectionContextData };
  data.context ??= {};
  return data.context;
}

/**
 * Build a `HandshakeContext` from a Socket.IO socket.
 *
 * @param socket Socket.IO socket-like object.
 */
export function buildHandshakeContext(socket: { handshake: unknown }): HandshakeContext {
  const handshake = socket.handshake as {
    headers?: Record<string, string | string[] | undefined>;
    query?: Record<string, string | string[] | undefined>;
    auth?: Record<string, unknown>;
    address?: string;
  };
  const headers = handshake.headers ?? {};
  const cookieHeader = headers['cookie'];
  const cookies = parseCookies(typeof cookieHeader === 'string' ? cookieHeader : '');
  return Object.freeze({
    headers: Object.freeze({ ...headers }),
    query: Object.freeze({ ...(handshake.query ?? {}) }),
    cookies: Object.freeze(cookies),
    auth: Object.freeze({ ...(handshake.auth ?? {}) }),
    address: handshake.address ?? '',
  });
}

function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const [key, ...rest] = part.split('=');
    if (!key) continue;
    out[key.trim()] = decodeURIComponent(rest.join('=').trim());
  }
  return out;
}

/**
 * Schedule a token-expiry callback.
 *
 * @param expiresAt Wall-clock instant the token expires.
 * @param onExpire Callback fired roughly five seconds before expiry.
 */
export function scheduleTokenExpiry(
  expiresAt: Date,
  onExpire: () => void,
): ReturnType<typeof setTimeout> {
  const ms = Math.max(0, expiresAt.getTime() - Date.now() - 5_000);
  return setTimeout(onExpire, ms);
}

export type { RoomId, UserContext };
