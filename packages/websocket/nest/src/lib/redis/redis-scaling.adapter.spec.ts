import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { io as createClient } from 'socket.io-client';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import { RedisScalingAdapter } from './redis-scaling.adapter';

describe('RedisScalingAdapter', () => {
  let redisContainer: StartedTestContainer;
  let redisUrl: string;

  beforeAll(async () => {
    redisContainer = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .start();
    redisUrl = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
  });

  afterAll(async () => {
    await redisContainer?.stop();
  });

  async function spawnServer(): Promise<{
    http: ReturnType<typeof createServer>;
    io: Server;
    port: number;
    adapter: RedisScalingAdapter;
  }> {
    const http = createServer();
    const io = new Server(http);
    const adapter = RedisScalingAdapter.create({ url: redisUrl });
    await adapter.install(io);
    const port = await new Promise<number>((resolve) => {
      http.listen(0, () => resolve((http.address() as { port: number }).port));
    });
    return { http, io, port, adapter };
  }

  it('relays broadcasts across Socket.IO server processes', async () => {
    const a = await spawnServer();
    const b = await spawnServer();

    const clientA = createClient(`http://localhost:${a.port}`, {
      transports: ['websocket'],
    });
    const clientB = createClient(`http://localhost:${b.port}`, {
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise<void>((resolve) => clientA.on('connect', () => resolve())),
      new Promise<void>((resolve) => clientB.on('connect', () => resolve())),
    ]);

    const seen = new Promise<unknown>((resolve) =>
      clientB.on('relay', resolve),
    );
    a.io.emit('relay', { hello: 'world' });
    expect(await seen).toEqual({ hello: 'world' });

    clientA.close();
    clientB.close();
    await a.adapter.dispose();
    await b.adapter.dispose();
    a.http.close();
    b.http.close();
  });
});
