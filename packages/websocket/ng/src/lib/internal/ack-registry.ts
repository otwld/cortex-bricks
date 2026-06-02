import { WsAckTimeoutError } from '@otwld/ts-websocket';

interface PendingAck {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

/** Result of `AckRegistry.register`. */
export interface AckHandle {
  /** Internal correlation id. */
  readonly id: string;
  /** Awaitable ack promise. */
  readonly promise: Promise<unknown>;
}

/**
 * Tracks in-flight `emitWithAck` requests with per-call timeout.
 */
export class AckRegistry {
  private nextId = 1;
  private readonly pending = new Map<string, PendingAck>();

  /**
   * Register a pending ack.
   *
   * @param pattern Event pattern.
   * @param timeoutMs Timeout in ms.
   */
  public register(pattern: string, timeoutMs: number): AckHandle {
    const id = `ack-${this.nextId++}`;
    let resolveFn: (value: unknown) => void = () => undefined;
    let rejectFn: (reason: unknown) => void = () => undefined;
    const promise = new Promise<unknown>((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    });
    const timer = setTimeout(() => {
      this.pending.delete(id);
      rejectFn(new WsAckTimeoutError({ pattern, timeoutMs }));
    }, timeoutMs);
    this.pending.set(id, { resolve: resolveFn, reject: rejectFn, timer });
    return { id, promise };
  }

  /** Resolve a pending ack by id. */
  public resolve(id: string, value: unknown): void {
    const entry = this.pending.get(id);
    if (!entry) return;
    clearTimeout(entry.timer);
    this.pending.delete(id);
    entry.resolve(value);
  }

  /** Reject a pending ack by id. */
  public reject(id: string, reason: unknown): void {
    const entry = this.pending.get(id);
    if (!entry) return;
    clearTimeout(entry.timer);
    this.pending.delete(id);
    entry.reject(reason);
  }

  /** Reject every pending ack. */
  public flushAll(reason: unknown): void {
    for (const entry of this.pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(reason);
    }
    this.pending.clear();
  }
}
