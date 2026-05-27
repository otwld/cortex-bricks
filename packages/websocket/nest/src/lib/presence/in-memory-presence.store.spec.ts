import type { UserContext } from '@otwld/ts-websocket';
import { InMemoryPresenceStore } from './in-memory-presence.store';

const u = (id: string): UserContext => ({ id, claims: {}, authenticatedAt: new Date() });

describe('InMemoryPresenceStore', () => {
  it('tracks members per room', async () => {
    const store = new InMemoryPresenceStore();
    await store.addMember('r1', 's1', u('alice'));
    await store.addMember('r1', 's2', u('bob'));

    const members = await store.members('r1');
    expect(members.map((member) => member.id).sort()).toEqual(['alice', 'bob']);
  });

  it('deduplicates same user across multiple sockets in members()', async () => {
    const store = new InMemoryPresenceStore();
    await store.addMember('r1', 's1', u('alice'));
    await store.addMember('r1', 's2', u('alice'));

    const members = await store.members('r1');
    expect(members.map((member) => member.id)).toEqual(['alice']);
  });

  it('removes member on removeMember and returns the removed user', async () => {
    const store = new InMemoryPresenceStore();
    const user = u('alice');
    await store.addMember('r1', 's1', user);
    await expect(store.removeMember('r1', 's1')).resolves.toEqual(user);
    expect(await store.members('r1')).toEqual([]);
  });

  it('returns undefined when removeMember does not remove a user', async () => {
    const store = new InMemoryPresenceStore();
    await expect(store.removeMember('r1', 'missing')).resolves.toBeUndefined();
  });

  it('removeSocket clears all rooms and reports them', async () => {
    const store = new InMemoryPresenceStore();
    await store.addMember('r1', 's1', u('alice'));
    await store.addMember('r2', 's1', u('alice'));

    const rooms = await store.removeSocket('s1');
    expect([...rooms].sort()).toEqual(['r1', 'r2']);
    expect(await store.members('r1')).toEqual([]);
    expect(await store.members('r2')).toEqual([]);
  });

  it('reports roomsOf, isOnline, online', async () => {
    const store = new InMemoryPresenceStore();
    await store.addMember('r1', 's1', u('alice'));
    await store.addMember('r2', 's1', u('alice'));

    expect([...(await store.roomsOf('alice'))].sort()).toEqual(['r1', 'r2']);
    expect(await store.isOnline('alice')).toBe(true);
    expect(await store.isOnline('ghost')).toBe(false);
    expect((await store.online()).map((user) => user.id)).toEqual(['alice']);
  });
});
