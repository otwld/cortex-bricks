import { firstValueFrom, take, toArray } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { SocketAdapter, type SocketIoFactory, type SocketIoLike } from './socket-adapter';

type Listener = (...args: unknown[]) => void;

interface CapturedEmit {
  readonly event: string;
  readonly args: readonly unknown[];
}

function fakeSocket(): {
  readonly socket: SocketIoLike;
  readonly emitted: CapturedEmit[];
  readonly trigger: (event: string, ...args: unknown[]) => void;
} {
  const handlers = new Map<string, Listener[]>();
  const emitted: CapturedEmit[] = [];
  const socket: SocketIoLike = {
    on: vi.fn((event: string, listener: Listener) => {
      handlers.set(event, [...(handlers.get(event) ?? []), listener]);
    }),
    off: vi.fn((event: string, listener?: Listener) => {
      if (!listener) {
        handlers.delete(event);
        return;
      }
      handlers.set(
        event,
        (handlers.get(event) ?? []).filter((candidate) => candidate !== listener),
      );
    }),
    emit: vi.fn((event: string, ...args: unknown[]) => {
      emitted.push({ event, args });
    }),
    close: vi.fn(),
    connect: vi.fn(),
    io: { engine: { transport: { name: 'websocket' } } },
  };

  return {
    socket,
    emitted,
    trigger: (event: string, ...args: unknown[]) => {
      for (const listener of handlers.get(event) ?? []) {
        listener(...args);
      }
    },
  };
}

describe('SocketAdapter', () => {
  it('exposes socket connection events and pattern streams', async () => {
    const { socket, trigger } = fakeSocket();
    const factory: SocketIoFactory = vi.fn(() => socket);
    const adapter = new SocketAdapter(
      'http://api/chat',
      { transports: ['websocket'], auth: { token: 't' } },
      factory,
    );

    const connected = firstValueFrom(adapter.connect$.pipe(take(1)));
    trigger('connect');
    await connected;

    const messages = firstValueFrom(
      adapter.event$('chat.new_message').pipe(take(2), toArray()),
    );
    trigger('chat.new_message', { id: 'a' });
    trigger('chat.new_message', { id: 'b' });

    expect(await messages).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(factory).toHaveBeenCalledWith('http://api/chat', {
      transports: ['websocket'],
      auth: { token: 't' },
    });
    expect(adapter.transportName).toBe('websocket');
  });

  it('emits fire-and-forget and raw ack events through the socket', async () => {
    const { socket, emitted } = fakeSocket();
    const adapter = new SocketAdapter('http://api/chat', {}, () => socket);

    adapter.emit('chat.typing', { roomId: 'r1' });
    const ackPromise = adapter.emitWithAckRaw('chat.send', { text: 'hi' });

    const send = emitted.find((entry) => entry.event === 'chat.send');
    const ack = send?.args[1] as ((response: unknown) => void) | undefined;
    ack?.({ id: 'm1' });

    expect(emitted.find((entry) => entry.event === 'chat.typing')?.args[0]).toEqual({
      roomId: 'r1',
    });
    await expect(ackPromise).resolves.toEqual({ id: 'm1' });
  });
});
