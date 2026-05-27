import { describe, expect, it, vi } from 'vitest';
import { ReconnectController } from './reconnect-controller';

describe('ReconnectController', () => {
  it('schedules attempts with exponential backoff capped at maxDelayMs', () => {
    vi.useFakeTimers();
    try {
      const onAttempt = vi.fn();
      const controller = new ReconnectController(
        { attempts: 3, initialDelayMs: 100, maxDelayMs: 1_000, backoffFactor: 2, jitter: 0 },
        onAttempt,
      );

      controller.start();
      vi.advanceTimersByTime(100);
      expect(onAttempt).toHaveBeenLastCalledWith(1);
      vi.advanceTimersByTime(200);
      expect(onAttempt).toHaveBeenLastCalledWith(2);
      vi.advanceTimersByTime(400);
      expect(onAttempt).toHaveBeenLastCalledWith(3);
      vi.advanceTimersByTime(2_000);
      expect(onAttempt).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels pending attempts when stopped', () => {
    vi.useFakeTimers();
    try {
      const onAttempt = vi.fn();
      const controller = new ReconnectController(
        { attempts: Infinity, initialDelayMs: 100, maxDelayMs: 100, backoffFactor: 1, jitter: 0 },
        onAttempt,
      );

      controller.start();
      controller.stop();
      vi.advanceTimersByTime(500);

      expect(onAttempt).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
