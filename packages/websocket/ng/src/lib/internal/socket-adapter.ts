import { fromEvent, Observable, share } from 'rxjs';
import type { ManagerOptions, SocketOptions } from 'socket.io-client';

/** Socket.IO client options used by the websocket adapter. */
export type SocketIoOptions = Partial<ManagerOptions & SocketOptions>;

/**
 * Subset of the Socket.IO client API used by the adapter.
 */
export interface SocketIoLike {
  /** Register a listener. */
  on(event: string, listener: (...args: unknown[]) => void): void;
  /** Remove a listener. */
  off(event: string, listener?: (...args: unknown[]) => void): void;
  /** Emit an event. */
  emit(event: string, ...args: unknown[]): void;
  /** Close the socket. */
  close(): void;
  /** Connect the socket. */
  connect(): void;
  /** Optional auth payload. */
  auth?: Record<string, unknown> | ((callback: (data: object) => void) => void);
  /** Socket.IO manager metadata. */
  io: { engine?: { transport?: { name?: string } } };
}

/**
 * Factory that creates a Socket.IO client.
 */
export type SocketIoFactory = (url: string, opts: SocketIoOptions) => SocketIoLike;

/**
 * Thin wrapper around `socket.io-client` exposing RxJS observables.
 */
export class SocketAdapter {
  /** Stream that emits when the socket connects. */
  public readonly connect$: Observable<void>;
  /** Stream that emits the disconnect reason. */
  public readonly disconnect$: Observable<string>;
  /** Stream that emits transport errors. */
  public readonly error$: Observable<Error>;

  private readonly perPattern = new Map<string, Observable<unknown>>();

  /**
   * @param url Server URL.
   * @param options Socket.IO options.
   * @param factory Socket factory.
   */
  public constructor(
    url: string,
    options: SocketIoOptions,
    factory: SocketIoFactory,
  ) {
    this.socket = factory(url, options);
    this.connect$ = fromEvent<void>(asEmitter(this.socket), 'connect').pipe(share());
    this.disconnect$ = fromEvent<string>(asEmitter(this.socket), 'disconnect').pipe(share());
    this.error$ = fromEvent<Error>(asEmitter(this.socket), 'connect_error').pipe(share());
  }

  /** Underlying socket. Exposed internally for auth refresh. */
  public readonly socket: SocketIoLike;

  /**
   * Stream of payloads for a given event pattern.
   *
   * @param pattern Event pattern.
   */
  public event$<T = unknown>(pattern: string): Observable<T> {
    let stream$ = this.perPattern.get(pattern);
    if (!stream$) {
      stream$ = fromEvent<unknown>(asEmitter(this.socket), pattern).pipe(share());
      this.perPattern.set(pattern, stream$);
    }
    return stream$ as Observable<T>;
  }

  /** Emit fire-and-forget. */
  public emit(pattern: string, payload: unknown): void {
    this.socket.emit(pattern, payload);
  }

  /**
   * Emit with a raw ack callback.
   *
   * @param pattern Event pattern.
   * @param payload Payload.
   */
  public emitWithAckRaw(pattern: string, payload: unknown): Promise<unknown> {
    return new Promise((resolve) => {
      this.socket.emit(pattern, payload, (response: unknown) => resolve(response));
    });
  }

  /** Close the underlying socket. */
  public close(): void {
    this.socket.close();
  }

  /** Trigger a connection. */
  public connect(): void {
    this.socket.connect();
  }

  /**
   * Replace the socket auth payload.
   *
   * @param auth Auth payload.
   */
  public setAuth(auth: Record<string, unknown>): void {
    this.socket.auth = auth;
  }

  /** Underlying transport name. */
  public get transportName(): string | null {
    return this.socket.io.engine?.transport?.name ?? null;
  }
}

interface SocketEmitterAdapter {
  addEventListener(event: string, listener: (...args: unknown[]) => void): void;
  removeEventListener(event: string, listener: (...args: unknown[]) => void): void;
}

function asEmitter(socket: SocketIoLike): SocketEmitterAdapter {
  return {
    addEventListener: (event, listener) => socket.on(event, listener),
    removeEventListener: (event, listener) => socket.off(event, listener),
  };
}
