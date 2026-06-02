import type { ReconnectStrategy } from '../models/reconnect-strategy.model';

/** Callback fired before each reconnect attempt. */
export type AttemptCallback = (attemptNumber: number) => void | Promise<void>;

/**
 * Schedules reconnection attempts with exponential backoff plus jitter.
 */
export class ReconnectController {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;
  private active = false;

  /**
   * @param strategy Backoff strategy.
   * @param onAttempt Callback invoked before each attempt.
   */
  public constructor(
    private readonly strategy: ReconnectStrategy,
    private readonly onAttempt: AttemptCallback,
  ) {}

  /** Begin scheduling attempts. */
  public start(): void {
    if (this.active) return;
    this.attempt = 0;
    this.active = true;
    this.scheduleNext();
  }

  /** Cancel any pending attempt. */
  public stop(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.active = false;
    this.attempt = 0;
  }

  /** Most recent attempt number. */
  public get currentAttempt(): number {
    return this.attempt;
  }

  private scheduleNext(): void {
    if (!this.active) return;
    if (this.attempt >= this.strategy.attempts) {
      this.stop();
      return;
    }
    const base = this.strategy.initialDelayMs * Math.pow(this.strategy.backoffFactor, this.attempt);
    const capped = Math.min(base, this.strategy.maxDelayMs);
    const jitter = capped * this.strategy.jitter * (Math.random() * 2 - 1);
    const delay = Math.max(0, capped + jitter);
    this.timer = setTimeout(() => {
      this.timer = null;
      if (!this.active) return;
      this.attempt += 1;
      const result = this.onAttempt(this.attempt);
      if (isPromiseLike(result)) {
        void result.catch(() => undefined).finally(() => this.scheduleNext());
        return;
      }
      this.scheduleNext();
    }, delay);
  }
}

function isPromiseLike(value: unknown): value is Promise<void> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}
