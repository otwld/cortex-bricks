import { WsAckTimeoutError, WsError, WsErrorKind } from '@otwld/ts-websocket';
import { describe, expect, it, vi } from 'vitest';
import { AckRegistry } from './ack-registry';

describe('AckRegistry', () => {
  it('resolves a pending ack by id', async () => {
    const registry = new AckRegistry();
    const handle = registry.register('chat.send', 1_000);

    registry.resolve(handle.id, { ok: true });

    await expect(handle.promise).resolves.toEqual({ ok: true });
  });

  it('rejects pending acks when the timeout elapses', async () => {
    vi.useFakeTimers();
    try {
      const registry = new AckRegistry();
      const handle = registry.register('chat.send', 50);

      vi.advanceTimersByTime(60);

      await expect(handle.promise).rejects.toBeInstanceOf(WsAckTimeoutError);
    } finally {
      vi.useRealTimers();
    }
  });

  it('flushes every pending ack with the supplied reason', async () => {
    const registry = new AckRegistry();
    const first = registry.register('chat.send', 1_000);
    const second = registry.register('chat.send', 1_000);
    const reason = new WsError({ kind: WsErrorKind.Transport, message: 'closed' });

    registry.flushAll(reason);

    await expect(first.promise).rejects.toBe(reason);
    await expect(second.promise).rejects.toBe(reason);
  });
});
