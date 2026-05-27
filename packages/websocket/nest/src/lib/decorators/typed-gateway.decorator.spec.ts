import {
  clientEvent,
  defineContract,
  serverEvent,
} from '@otwld/ts-websocket';
import type { Socket } from 'socket.io';
import { z } from 'zod';
import {
  setWebsocketLifecycleDelegate,
  type WebsocketLifecycleDelegate,
} from '../gateway/connection-context';
import { TypedGateway } from './typed-gateway.decorator';

const contract = defineContract({
  namespace: '/typed-gateway-test',
  c2s: {
    echo: clientEvent('echo')
      .payload(z.object({ msg: z.string() }))
      .response(z.object({ msg: z.string() }))
      .build(),
  },
  s2c: {
    pong: serverEvent('pong').payload(z.object({})).build(),
  },
});

const noopDelegate: WebsocketLifecycleDelegate = {
  async handleInit(): Promise<void> {
    return Promise.resolve();
  },
  async handleConnection(): Promise<void> {
    return Promise.resolve();
  },
  async handleDisconnect(): Promise<void> {
    return Promise.resolve();
  },
};

describe('@TypedGateway', () => {
  afterEach(() => {
    setWebsocketLifecycleDelegate(noopDelegate);
  });

  it('preserves user-defined lifecycle hooks while invoking the lifecycle delegate once', async () => {
    const calls: string[] = [];
    const server = { name: 'server' };
    const socket = { id: 'socket-1' } as Socket;

    @TypedGateway(contract)
    class CustomLifecycleGateway {
      public async afterInit(receivedServer: unknown): Promise<void> {
        expect(this).toBe(gateway);
        expect(receivedServer).toBe(server);
        calls.push('user:init');
      }

      public async handleConnection(receivedSocket: Socket): Promise<void> {
        expect(this).toBe(gateway);
        expect(receivedSocket).toBe(socket);
        calls.push('user:connect');
      }

      public async handleDisconnect(receivedSocket: Socket): Promise<void> {
        expect(this).toBe(gateway);
        expect(receivedSocket).toBe(socket);
        calls.push('user:disconnect');
      }
    }

    TypedGateway(contract)(CustomLifecycleGateway);
    const gateway = new CustomLifecycleGateway();
    const delegate: WebsocketLifecycleDelegate = {
      async handleInit(receivedServer, receivedGateway): Promise<void> {
        expect(receivedServer).toBe(server);
        expect(receivedGateway).toBe(gateway);
        calls.push('delegate:init');
      },
      async handleConnection(receivedSocket, receivedGateway): Promise<void> {
        expect(receivedSocket).toBe(socket);
        expect(receivedGateway).toBe(gateway);
        calls.push('delegate:connect');
      },
      async handleDisconnect(receivedSocket, receivedGateway): Promise<void> {
        expect(receivedSocket).toBe(socket);
        expect(receivedGateway).toBe(gateway);
        calls.push('delegate:disconnect');
      },
    };
    setWebsocketLifecycleDelegate(delegate);

    await gateway.afterInit(server);
    await gateway.handleConnection(socket);
    await gateway.handleDisconnect(socket);

    expect(calls).toEqual([
      'delegate:init',
      'user:init',
      'delegate:connect',
      'user:connect',
      'delegate:disconnect',
      'user:disconnect',
    ]);
  });
});
