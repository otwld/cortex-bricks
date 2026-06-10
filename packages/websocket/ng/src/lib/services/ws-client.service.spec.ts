import { ConnectionState, clientEvent, defineContract, serverEvent, withRoomManagement, WsErrorKind } from '@otwld/ts-websocket';
import { firstValueFrom, take } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { type SocketIoFactory, type SocketIoLike } from '../internal/socket-adapter';
import { BearerTokenWsAuthAdapter } from './bearer-token-ws-auth.adapter';
import { WsClient } from './ws-client.service';

const contract = defineContract({
  namespace: '/chat',
  c2s: {
    ...withRoomManagement(),
    send: clientEvent('chat.send')
      .payload(z.object({ roomId: z.string(), text: z.string() }))
      .response(z.object({ messageId: z.string(), serverTimestamp: z.number() }))
      .build(),
    typing: clientEvent('chat.typing').payload(z.object({ roomId: z.string() })).build(),
  },
  s2c: {
    msg: serverEvent('chat.message')
      .payload(z.object({ id: z.string(), text: z.string() }))
      .build(),
  },
});

type Listener = (...args: unknown[]) => void;

interface CapturedEmit {
  readonly event: string;
  readonly args: readonly unknown[];
}

function fakeSocketFactory(): {
  readonly socket: SocketIoLike;
  readonly emitted: CapturedEmit[];
  readonly factory: SocketIoFactory;
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

      const nextHandlers = (handlers.get(event) ?? []).filter((handler) => handler !== listener);
      if (nextHandlers.length === 0) {
        handlers.delete(event);
      } else {
        handlers.set(event, nextHandlers);
      }
    }),
    emit: vi.fn((event: string, ...args: unknown[]) => {
      emitted.push({ event, args });
    }),
    close: vi.fn(),
    connect: vi.fn(),
    auth: {},
    io: { engine: { transport: { name: 'websocket' } } },
  };
  return {
    socket,
    emitted,
    factory: vi.fn(() => socket),
    trigger: (event: string, ...args: unknown[]) => {
      for (const listener of handlers.get(event) ?? []) {
        listener(...args);
      }
    },
  };
}

describe('WsClient', () => {
  it('connects to the contract namespace and reflects connection state in signals', async () => {
    const fake = fakeSocketFactory();
    const client = new WsClient(
      contract,
      {
        url: 'http://api/',
        auth: { adapter: BearerTokenWsAuthAdapter.from(() => 'token-1') },
      },
      fake.factory,
    );

    await Promise.resolve();
    fake.trigger('connect');

    expect(fake.factory).toHaveBeenCalledWith('http://api/chat', {
      transports: ['websocket'],
      autoConnect: false,
    });
    expect(fake.socket.auth).toEqual({ token: 'token-1' });
    expect(fake.socket.connect).toHaveBeenCalledTimes(1);
    expect(client.state()).toBe(ConnectionState.Connected);
    expect(client.connected()).toBe(true);
    expect(client.transport()).toBe('websocket');
  });

  it('forwards fire-and-forget emits to the socket', () => {
    const fake = fakeSocketFactory();
    const client = new WsClient(contract, { url: 'http://api', autoConnect: false }, fake.factory);

    client.emit(contract.c2s.typing, { roomId: 'r1' });

    expect(fake.emitted.find((entry) => entry.event === 'chat.typing')?.args[0]).toEqual({
      roomId: 'r1',
    });
  });

  it('resolves emitWithAck with the parsed ack response', async () => {
    const fake = fakeSocketFactory();
    const client = new WsClient(
      contract,
      { url: 'http://api', autoConnect: false, defaultAckTimeoutMs: 1_000 },
      fake.factory,
    );

    const ackPromise = client.emitWithAck(contract.c2s.send, {
      roomId: 'r1',
      text: 'hello',
    });
    const emit = fake.emitted.find((entry) => entry.event === 'chat.send');
    const ack = emit?.args[1] as ((response: unknown) => void) | undefined;
    ack?.({ messageId: 'm1', serverTimestamp: 123 });

    await expect(ackPromise).resolves.toEqual({ messageId: 'm1', serverTimestamp: 123 });
  });

  it('streams only validated server payloads and reports invalid payload errors', async () => {
    const fake = fakeSocketFactory();
    const client = new WsClient(contract, { url: 'http://api', autoConnect: false }, fake.factory);
    const message = firstValueFrom(client.on(contract.s2c.msg).pipe(take(1)));

    fake.trigger('chat.message', { id: 'a', text: 'hello' });

    await expect(message).resolves.toEqual({ id: 'a', text: 'hello' });

    const error = firstValueFrom(client.errors$.pipe(take(1)));
    const validationSubscription = client.on(contract.s2c.msg).subscribe();
    fake.trigger('chat.message', { id: 42, text: 'bad' });
    expect((await error).kind).toBe(WsErrorKind.InvalidPayload);
    validationSubscription.unsubscribe();
  });

  it('builds room handles that join, leave, and reflect presence updates', async () => {
    const fake = fakeSocketFactory();
    const client = new WsClient(contract, { url: 'http://api', autoConnect: false }, fake.factory);
    const room = client.room('r1');

    const join = room.join();
    const joinEmit = fake.emitted.find((entry) => entry.event === 'room.join');
    const joinAck = joinEmit?.args[1] as ((response: unknown) => void) | undefined;
    joinAck?.({ ok: true });
    await join;

    fake.trigger('presence:update', { room: 'r1', members: [{ id: 'u1' }, { id: 'u2' }] });

    expect(room.joined()).toBe(true);
    expect(room.members()).toEqual([{ id: 'u1' }, { id: 'u2' }]);
    expect(room.memberCount()).toBe(2);

    const leave = room.leave();
    const leaveEmit = fake.emitted.find((entry) => entry.event === 'room.leave');
    const leaveAck = leaveEmit?.args[1] as ((response: unknown) => void) | undefined;
    leaveAck?.({ ok: true });
    await leave;

    expect(room.joined()).toBe(false);
  });

  it('starts reconnect attempts after unexpected disconnects', () => {
    vi.useFakeTimers();
    try {
      const fake = fakeSocketFactory();
      const client = new WsClient(
        contract,
        {
          url: 'http://api',
          reconnect: {
            attempts: 2,
            initialDelayMs: 100,
            maxDelayMs: 100,
            backoffFactor: 1,
            jitter: 0,
          },
        },
        fake.factory,
      );

      fake.trigger('connect');
      fake.trigger('disconnect', 'transport close');
      vi.advanceTimersByTime(100);

      expect(client.state()).toBe(ConnectionState.Reconnecting);
      expect(client.reconnectAttempt()).toBe(1);
      expect(fake.socket.connect).toHaveBeenCalledTimes(2);

      fake.trigger('connect');
      expect(client.reconnectAttempt()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not reconnect after an intentional disconnect', async () => {
    vi.useFakeTimers();
    try {
      const fake = fakeSocketFactory();
      const client = new WsClient(contract, { url: 'http://api' }, fake.factory);
      fake.socket.close = vi.fn(() => fake.trigger('disconnect', 'io client disconnect'));

      await Promise.resolve();
      fake.trigger('connect');
      await client.disconnect();
      vi.advanceTimersByTime(1_000);

      expect(client.state()).toBe(ConnectionState.Closed);
      expect(fake.socket.connect).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('tears down socket subscriptions after disconnect', async () => {
    const fake = fakeSocketFactory();
    const client = new WsClient(contract, { url: 'http://api', autoConnect: false }, fake.factory);
    const latestMessage = client.signal(contract.s2c.msg, { id: 'initial', text: 'initial' });
    const room = client.room('r1');

    fake.trigger('chat.message', { id: 'before-disconnect', text: 'hello' });
    expect(latestMessage()).toEqual({ id: 'before-disconnect', text: 'hello' });

    await client.disconnect();
    fake.trigger('connect');
    fake.trigger('chat.message', { id: 'after-disconnect', text: 'ignored' });
    fake.trigger('presence:update', { room: 'r1', members: [{ id: 'u1' }] });

    expect(client.state()).toBe(ConnectionState.Closed);
    expect(latestMessage()).toEqual({ id: 'before-disconnect', text: 'hello' });
    expect(room.members()).toEqual([]);
    expect(fake.socket.off).toHaveBeenCalled();
  });

  it('uses auth onConnectError retry hook', async () => {
    const fake = fakeSocketFactory();
    const auth = {
      getToken: vi.fn().mockResolvedValueOnce('expired').mockResolvedValueOnce('fresh'),
      onConnectError: vi.fn(() => 'retry' as const),
    };

    new WsClient(contract, { url: 'http://api', auth: { adapter: auth } }, fake.factory);
    await Promise.resolve();
    fake.trigger('connect_error', new Error('unauthorized'));
    await Promise.resolve();

    expect(auth.onConnectError).toHaveBeenCalled();
    expect(fake.socket.auth).toEqual({ token: 'fresh' });
    expect(fake.socket.connect).toHaveBeenCalledTimes(2);
  });
});
