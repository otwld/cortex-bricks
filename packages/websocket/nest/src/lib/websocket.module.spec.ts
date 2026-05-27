import { Module, type INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConnectedSocket } from '@nestjs/websockets';
import { Test } from '@nestjs/testing';
import {
  clientEvent,
  defineContract,
  serverEvent,
  type HandshakeContext,
  type RoomId,
  type UserContext,
  withRoomManagement,
} from '@otwld/ts-websocket';
import {
  io as createClient,
  type Socket as ClientSocket,
} from 'socket.io-client';
import type { Namespace, Server, Socket as ServerSocket } from 'socket.io';
import { z } from 'zod';
import { WsAuthAdapter } from './adapters/ws-auth-adapter';
import { WsScalingAdapter } from './adapters/ws-scaling-adapter';
import { resolveWebsocketModuleOptions } from './config/websocket-module-options';
import { OnEvent } from './decorators/on-event.decorator';
import { TypedGateway } from './decorators/typed-gateway.decorator';
import { WsPayload } from './decorators/ws-payload.decorator';
import { TypedServerRegistry } from './gateway/typed-server-registry';
import { InMemoryPresenceStore } from './presence/in-memory-presence.store';
import { PresenceService } from './presence/presence.service';
import { WebsocketLifecycle, WebsocketModule } from './websocket.module';

const TestContract = defineContract({
  namespace: '/test',
  c2s: {
    ...withRoomManagement(),
    echo: clientEvent('echo')
      .payload(z.object({ msg: z.string() }))
      .response(z.object({ msg: z.string() }))
      .build(),
  },
  s2c: {
    presenceUpdate: serverEvent('presence:update')
      .payload(z.object({}))
      .build(),
  },
});

const PublicRoomContract = defineContract({
  namespace: '/public-room',
  c2s: {
    ...withRoomManagement(),
  },
  s2c: {
    presenceUpdate: serverEvent('presence:update')
      .payload(z.object({}))
      .build(),
  },
});

const DeferredRoomContract = defineContract({
  namespace: '/deferred-room',
  c2s: {
    ...withRoomManagement(),
  },
  s2c: {
    presenceUpdate: serverEvent('presence:update')
      .payload(z.object({}))
      .build(),
  },
});

const SharedRoomContract = defineContract({
  namespace: '/shared-room',
  c2s: {
    ...withRoomManagement(),
  },
  s2c: {
    presenceUpdate: serverEvent('presence:update')
      .payload(z.object({}))
      .build(),
  },
});

class TestAuth extends WsAuthAdapter {
  public async authenticate(
    handshake: HandshakeContext,
  ): Promise<UserContext | null> {
    const token = String(handshake.auth['token'] ?? '');
    if (token !== 'good') return null;
    return { id: 'alice', claims: {}, authenticatedAt: new Date() };
  }
}

class TestScalingAdapter extends WsScalingAdapter {
  public installs = 0;
  public disposes = 0;

  public async install(): Promise<void> {
    this.installs += 1;
  }

  public async dispose(): Promise<void> {
    this.disposes += 1;
  }
}

class DeferredScalingAdapter extends WsScalingAdapter {
  public installs = 0;
  public disposes = 0;
  private resolveInstall?: () => void;
  private readonly installPromise = new Promise<void>((resolve) => {
    this.resolveInstall = resolve;
  });

  public async install(): Promise<void> {
    this.installs += 1;
    return this.installPromise;
  }

  public async dispose(): Promise<void> {
    this.disposes += 1;
  }

  public completeInstall(): void {
    this.resolveInstall?.();
  }
}

let countingAuthCalls = 0;

class CountingAuth extends WsAuthAdapter {
  public async authenticate(
    handshake: HandshakeContext,
  ): Promise<UserContext | null> {
    countingAuthCalls += 1;
    const token = String(handshake.auth['token'] ?? '');
    if (token !== 'good') return null;
    return { id: 'alice', claims: {}, authenticatedAt: new Date() };
  }
}

let markDeferredResolveRoomsStarted: (() => void) | undefined;
let releaseDeferredResolveRooms:
  | ((rooms: readonly RoomId[]) => void)
  | undefined;
let deferredResolveRoomsStarted = Promise.resolve();
let deferredResolveRooms = Promise.resolve<readonly RoomId[]>([]);

function resetDeferredResolveRooms(): void {
  deferredResolveRoomsStarted = new Promise<void>((resolve) => {
    markDeferredResolveRoomsStarted = resolve;
  });
  deferredResolveRooms = new Promise<readonly RoomId[]>((resolve) => {
    releaseDeferredResolveRooms = resolve;
  });
}

function completeDeferredResolveRooms(
  rooms: readonly RoomId[] = ['auth-r1'],
): void {
  releaseDeferredResolveRooms?.(rooms);
  releaseDeferredResolveRooms = undefined;
}

class DeferredRoomsAuth extends TestAuth {
  public override async resolveRooms(): Promise<readonly RoomId[]> {
    markDeferredResolveRoomsStarted?.();
    return deferredResolveRooms;
  }
}

let customRoomJoinCalls = 0;

@TypedGateway(TestContract)
class TestGateway {
  @OnEvent(TestContract.c2s.echo)
  public async echo(
    @WsPayload() payload: { msg: string },
    @ConnectedSocket() socket: ServerSocket,
  ): Promise<{ msg: string }> {
    expect(socket.id).toBeTruthy();
    return { msg: payload.msg.toUpperCase() };
  }
}

@Module({
  imports: [WebsocketModule.forRoot({ authAdapter: TestAuth })],
  providers: [TestGateway],
})
class TestAppModule {}

const scalingAdapter = new TestScalingAdapter();

@Module({
  imports: [WebsocketModule.forRoot({ authAdapter: TestAuth, scalingAdapter })],
  providers: [TestGateway],
})
class ScalingTestAppModule {}

@TypedGateway(TestContract, { requireAuth: false })
class PublicGateway {}

@TypedGateway(TestContract)
class StrictGateway {}

@Module({
  imports: [WebsocketModule.forRoot({ authAdapter: TestAuth })],
  providers: [PublicGateway, StrictGateway],
})
class MixedPolicyGatewayAppModule {}

@TypedGateway(PublicRoomContract, { requireAuth: false })
class PublicRoomGateway {}

@Module({
  imports: [WebsocketModule.forRoot({ authAdapter: TestAuth })],
  providers: [PublicRoomGateway],
})
class PublicRoomAppModule {}

@TypedGateway(DeferredRoomContract)
class DeferredRoomGateway {}

@Module({
  imports: [WebsocketModule.forRoot({ authAdapter: DeferredRoomsAuth })],
  providers: [DeferredRoomGateway],
})
class DeferredRoomAppModule {}

@TypedGateway(SharedRoomContract)
class CustomSharedRoomGateway {
  @OnEvent(SharedRoomContract.c2s.joinRoom)
  public onJoin(): { ok: true } {
    customRoomJoinCalls += 1;
    return { ok: true };
  }
}

@TypedGateway(SharedRoomContract)
class DefaultSharedRoomGateway {}

@Module({
  imports: [WebsocketModule.forRoot({ authAdapter: TestAuth })],
  providers: [CustomSharedRoomGateway, DefaultSharedRoomGateway],
})
class SharedRoomAppModule {}

@TypedGateway(TestContract)
class DuplicateGatewayOne {}

@TypedGateway(TestContract)
class DuplicateGatewayTwo {}

@Module({
  imports: [WebsocketModule.forRoot({ authAdapter: CountingAuth })],
  providers: [DuplicateGatewayOne, DuplicateGatewayTwo],
})
class DuplicateGatewayAppModule {}

@Module({
  imports: [
    WebsocketModule.forRootAsync({
      useFactory: () => ({ authAdapter: TestAuth }),
    }),
  ],
})
class AsyncWebsocketModule {}

describe('WebsocketModule (integration)', () => {
  let app: INestApplication;
  let port: number;

  beforeAll(async () => {
    const ref = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();
    app = ref.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(0);
    port = (app.getHttpServer().address() as { port: number }).port;
  });

  afterAll(async () => {
    await app.close();
  });

  function connect(token: string) {
    const socket = createClient(`http://localhost:${port}/test`, {
      auth: { token },
      reconnection: false,
      transports: ['websocket'],
    });

    return new Promise((resolve: (socket: ClientSocket) => void, reject) => {
      socket.on('connect_error', reject);
      socket.on('disconnect', () => reject(new Error('disconnected')));
      socket.on('connect', () => {
        setTimeout(() => {
          if (socket.connected) resolve(socket);
          else reject(new Error('disconnected'));
        }, 25);
      });
    });
  }

  it('rejects connections with bad tokens', async () => {
    await expect(connect('bad')).rejects.toBeTruthy();
  });

  it('rejects unauthorized clients before handlers can process messages', async () => {
    const bad = createClient(`http://localhost:${port}/test`, {
      auth: { token: 'bad' },
      reconnection: false,
      transports: ['websocket'],
    });

    await expect(
      new Promise((resolve, reject) => {
        bad.on('connect', () => reject(new Error('unexpected connect')));
        bad.on('connect_error', resolve);
      }),
    ).resolves.toBeDefined();

    bad.emit('echo', { msg: 'should-not-run' });
    bad.close();
  });

  it('accepts connections with good tokens and validates payload', async () => {
    const socket = await connect('good');
    const ack = await socket.emitWithAck('echo', { msg: 'hi' });
    expect(ack).toEqual({ msg: 'HI' });
    socket.close();
  });

  it('handles default room join and broadcasts presence updates', async () => {
    const socket = await connect('good');
    const update = new Promise<unknown>((resolve) =>
      socket.on('presence:update', resolve),
    );

    const ack = await socket.emitWithAck('room.join', { roomId: 'r1' });

    expect(ack).toEqual({ ok: true });
    expect(await update).toEqual({ room: 'r1', members: [{ id: 'alice' }] });
    socket.close();
  });

  it('emits an exception for invalid default room join payloads', async () => {
    const socket = await connect('good');
    const exception = new Promise<unknown>((resolve) =>
      socket.on('exception', resolve),
    );

    socket.emit('room.join', { roomId: 42 });

    await expect(exception).resolves.toBeDefined();
    socket.close();
  });

  it('handles default room join for public gateways without presence members', async () => {
    const ref = await Test.createTestingModule({
      imports: [PublicRoomAppModule],
    }).compile();
    const publicApp = ref.createNestApplication();
    publicApp.useWebSocketAdapter(new IoAdapter(publicApp));
    await publicApp.listen(0);
    const publicPort = (publicApp.getHttpServer().address() as { port: number })
      .port;
    let socket: ClientSocket | undefined;

    try {
      socket = createClient(`http://localhost:${publicPort}/public-room`, {
        reconnection: false,
        transports: ['websocket'],
      });

      await new Promise<void>((resolve, reject) => {
        socket?.on('connect_error', reject);
        socket?.on('connect', () => resolve());
      });

      const update = new Promise<unknown>((resolve) =>
        socket?.on('presence:update', resolve),
      );

      const ack = await socket
        .timeout(500)
        .emitWithAck('room.join', { roomId: 'public-r1' });

      expect(ack).toEqual({ ok: true });
      expect(await update).toEqual({ room: 'public-r1', members: [] });
    } finally {
      socket?.close();
      await publicApp.close();
    }
  });

  it('does not install default room handlers when another gateway in the namespace has a custom handler', async () => {
    customRoomJoinCalls = 0;
    const ref = await Test.createTestingModule({
      imports: [SharedRoomAppModule],
    }).compile();
    const sharedApp = ref.createNestApplication();
    sharedApp.useWebSocketAdapter(new IoAdapter(sharedApp));
    await sharedApp.listen(0);
    const sharedPort = (sharedApp.getHttpServer().address() as { port: number })
      .port;
    let socket: ClientSocket | undefined;

    try {
      socket = createClient(`http://localhost:${sharedPort}/shared-room`, {
        auth: { token: 'good' },
        reconnection: false,
        transports: ['websocket'],
      });

      await new Promise<void>((resolve, reject) => {
        socket?.on('connect_error', reject);
        socket?.on('connect', () => resolve());
      });

      const presenceUpdate = new Promise<'updated' | 'none'>((resolve) => {
        socket?.on('presence:update', () => resolve('updated'));
        setTimeout(() => resolve('none'), 100);
      });

      const ack = await socket.emitWithAck('room.join', {
        roomId: 'shared-r1',
      });

      expect(ack).toEqual({ ok: true });
      expect(customRoomJoinCalls).toBe(1);
      expect(await presenceUpdate).toBe('none');
    } finally {
      socket?.close();
      await sharedApp.close();
    }
  });

  it('installs default room handlers after authenticated auto-joins complete', async () => {
    resetDeferredResolveRooms();
    const ref = await Test.createTestingModule({
      imports: [DeferredRoomAppModule],
    }).compile();
    const deferredApp = ref.createNestApplication();
    deferredApp.useWebSocketAdapter(new IoAdapter(deferredApp));
    await deferredApp.listen(0);
    const deferredPort = (
      deferredApp.getHttpServer().address() as { port: number }
    ).port;
    let socket: ClientSocket | undefined;

    try {
      socket = createClient(`http://localhost:${deferredPort}/deferred-room`, {
        auth: { token: 'good' },
        reconnection: false,
        transports: ['websocket'],
      });

      await new Promise<void>((resolve, reject) => {
        socket?.on('connect_error', reject);
        socket?.on('connect', () => resolve());
      });
      await deferredResolveRoomsStarted;

      const ack = socket
        .timeout(1_000)
        .emitWithAck('room.join', { roomId: 'manual-r1' });
      const earlyResult = await Promise.race([
        ack.then(() => 'acked' as const),
        new Promise<'pending'>((resolve) =>
          setTimeout(() => resolve('pending'), 50),
        ),
      ]);

      expect(earlyResult).toBe('pending');

      completeDeferredResolveRooms();

      await expect(ack).resolves.toEqual({ ok: true });
    } finally {
      completeDeferredResolveRooms();
      socket?.close();
      await deferredApp.close();
    }
  });

  it('returns an error response for bad payloads', async () => {
    const socket = await connect('good');
    const exception = new Promise<unknown>((resolve) =>
      socket.on('exception', resolve),
    );
    socket.emit('echo', { msg: 42 });
    expect(await exception).toBeDefined();
    socket.close();
  });

  it('registers lifecycle providers when configured through forRootAsync', async () => {
    const ref = await Test.createTestingModule({
      imports: [AsyncWebsocketModule],
    }).compile();

    expect(ref.get(WsAuthAdapter)).toBeInstanceOf(TestAuth);
    expect(ref.get(WebsocketLifecycle)).toBeInstanceOf(WebsocketLifecycle);
  });

  it('installs scaling once during gateway initialization', async () => {
    const ref = await Test.createTestingModule({
      imports: [ScalingTestAppModule],
    }).compile();
    const scalingApp = ref.createNestApplication();
    scalingApp.useWebSocketAdapter(new IoAdapter(scalingApp));
    await scalingApp.listen(0);

    expect(scalingAdapter.installs).toBe(1);

    await scalingApp.close();
    expect(scalingAdapter.disposes).toBe(1);
  });

  it('authenticates only once for duplicate gateways sharing a namespace', async () => {
    countingAuthCalls = 0;
    const ref = await Test.createTestingModule({
      imports: [DuplicateGatewayAppModule],
    }).compile();
    const duplicateApp = ref.createNestApplication();
    duplicateApp.useWebSocketAdapter(new IoAdapter(duplicateApp));
    await duplicateApp.listen(0);
    const duplicatePort = (
      duplicateApp.getHttpServer().address() as { port: number }
    ).port;
    let socket: ClientSocket | undefined;

    try {
      socket = createClient(`http://localhost:${duplicatePort}/test`, {
        auth: { token: 'good' },
        reconnection: false,
        transports: ['websocket'],
      });

      await new Promise<void>((resolve, reject) => {
        socket?.on('connect_error', reject);
        socket?.on('connect', () => resolve());
      });

      expect(countingAuthCalls).toBe(1);
    } finally {
      socket?.close();
      await duplicateApp.close();
    }
  });

  it('requires auth when any duplicate gateway sharing a namespace requires auth', async () => {
    const ref = await Test.createTestingModule({
      imports: [MixedPolicyGatewayAppModule],
    }).compile();
    const mixedApp = ref.createNestApplication();
    mixedApp.useWebSocketAdapter(new IoAdapter(mixedApp));
    await mixedApp.listen(0);
    const mixedPort = (mixedApp.getHttpServer().address() as { port: number })
      .port;
    let socket: ClientSocket | undefined;

    try {
      socket = createClient(`http://localhost:${mixedPort}/test`, {
        auth: { token: 'bad' },
        reconnection: false,
        transports: ['websocket'],
      });

      await expect(
        new Promise((resolve, reject) => {
          socket?.on('connect', () => reject(new Error('unexpected connect')));
          socket?.on('connect_error', resolve);
        }),
      ).resolves.toBeDefined();
    } finally {
      socket?.close();
      await mixedApp.close();
    }
  });

  it('starts scaling install once for concurrent gateway initialization', async () => {
    const scaling = new DeferredScalingAdapter();
    const lifecycle = new WebsocketLifecycle(
      resolveWebsocketModuleOptions({ authAdapter: TestAuth }),
      new TestAuth(),
      new PresenceService(new InMemoryPresenceStore()),
      new TypedServerRegistry(),
      scaling,
    );
    const namespace = {
      server: {} as Server,
      use: vi.fn(),
    } as unknown as Namespace;

    const first = lifecycle.handleInit(namespace);
    const second = lifecycle.handleInit(namespace);

    try {
      expect(scaling.installs).toBe(1);
    } finally {
      scaling.completeInstall();
      await Promise.allSettled([first, second]);
      await lifecycle.onApplicationShutdown();
    }
  });
});
