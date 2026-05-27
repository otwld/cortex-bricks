import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { PresenceTracker } from './presence-tracker';

describe('PresenceTracker', () => {
  it('updates the matching room signal when presence updates arrive', () => {
    const stream$ = new Subject<{ room: string; members: { id: string }[] }>();
    const tracker = new PresenceTracker(stream$);
    const roomOne = tracker.signalFor('r1');

    expect(roomOne()).toEqual([]);

    stream$.next({ room: 'r1', members: [{ id: 'a' }, { id: 'b' }] });
    expect(roomOne()).toEqual([{ id: 'a' }, { id: 'b' }]);

    stream$.next({ room: 'r2', members: [{ id: 'c' }] });
    expect(roomOne()).toEqual([{ id: 'a' }, { id: 'b' }]);
  });
});
