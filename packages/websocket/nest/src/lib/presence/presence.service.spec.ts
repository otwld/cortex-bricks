import type { UserContext } from '@otwld/ts-websocket';
import { firstValueFrom } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { InMemoryPresenceStore } from './in-memory-presence.store';
import { PresenceService } from './presence.service';

const u = (id: string): UserContext => ({ id, claims: {}, authenticatedAt: new Date() });

describe('PresenceService', () => {
  it('emits onJoin events', async () => {
    const svc = new PresenceService(new InMemoryPresenceStore());
    const collected = firstValueFrom(svc.onJoin('r1').pipe(take(1), toArray()));
    const user = u('alice');
    await svc.recordJoin('r1', 's1', user);
    expect(await collected).toEqual([user]);
  });

  it('emits onLeave events', async () => {
    const svc = new PresenceService(new InMemoryPresenceStore());
    await svc.recordJoin('r1', 's1', u('alice'));
    const collected = firstValueFrom(svc.onLeave('r1').pipe(take(1), toArray()));
    await svc.recordLeave('r1', 's1');
    expect((await collected).map((member) => member.id)).toEqual(['alice']);
  });

  it('emits the user for the socket that actually left', async () => {
    const svc = new PresenceService(new InMemoryPresenceStore());
    await svc.recordJoin('r1', 's1', u('alice'));
    await svc.recordJoin('r1', 's2', u('bob'));
    const collected = firstValueFrom(svc.onLeave('r1').pipe(take(1), toArray()));

    await svc.recordLeave('r1', 's2');

    expect((await collected).map((member) => member.id)).toEqual(['bob']);
  });

  it('proxies query methods to the store', async () => {
    const svc = new PresenceService(new InMemoryPresenceStore());
    await svc.recordJoin('r1', 's1', u('alice'));
    expect((await svc.members('r1')).map((member) => member.id)).toEqual(['alice']);
    expect(await svc.isOnline('alice')).toBe(true);
  });
});
