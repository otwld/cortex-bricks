import type { UserContext } from '@otwld/ts-websocket';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import { RedisPresenceStore } from './redis-presence.store';

const u = (id: string): UserContext => ({
  id,
  claims: {},
  authenticatedAt: new Date(0),
});

describe('RedisPresenceStore', () => {
  let container: StartedTestContainer;
  let store: RedisPresenceStore;

  beforeAll(async () => {
    container = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .start();
    const url = `redis://${container.getHost()}:${container.getMappedPort(6379)}`;
    store = await RedisPresenceStore.create({ url, keyPrefix: 'test:' });
  });

  afterAll(async () => {
    await store?.dispose();
    await container?.stop();
  });

  beforeEach(async () => {
    await store.flushAll();
  });

  it('persists membership across instances', async () => {
    await store.addMember('r1', 's1', u('alice'));
    expect((await store.members('r1')).map((member) => member.id)).toEqual([
      'alice',
    ]);
  });

  it('removeSocket clears all rooms', async () => {
    await store.addMember('r1', 's1', u('alice'));
    await store.addMember('r2', 's1', u('alice'));
    const rooms = await store.removeSocket('s1');
    expect([...rooms].sort()).toEqual(['r1', 'r2']);
    expect(await store.members('r1')).toEqual([]);
    expect(await store.members('r2')).toEqual([]);
  });

  it('removeMember returns the removed user', async () => {
    await store.addMember('r1', 's1', u('alice'));
    await expect(store.removeMember('r1', 's1')).resolves.toEqual(u('alice'));
    expect(await store.members('r1')).toEqual([]);
  });

  it('removeMember clears socket and user indexes when removing the last room', async () => {
    await store.addMember('r1', 's1', u('alice'));

    await expect(store.removeMember('r1', 's1')).resolves.toEqual(u('alice'));

    expect(await store.members('r1')).toEqual([]);
    expect(await store.roomsOf('alice')).toEqual([]);
    expect(await store.isOnline('alice')).toBe(false);
    expect((await store.online()).map((member) => member.id)).not.toContain(
      'alice',
    );
  });

  it('isOnline + roomsOf reflect Redis state', async () => {
    await store.addMember('r1', 's1', u('alice'));
    expect(await store.isOnline('alice')).toBe(true);
    expect(await store.isOnline('ghost')).toBe(false);
    expect([...(await store.roomsOf('alice'))].sort()).toEqual(['r1']);
  });
});
