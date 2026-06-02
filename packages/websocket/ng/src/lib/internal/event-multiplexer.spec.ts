import {
  defineContract,
  serverEvent,
  WsErrorKind,
} from '@otwld/ts-websocket';
import { firstValueFrom, Subject, take, toArray } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { EventMultiplexer } from './event-multiplexer';

const contract = defineContract({
  c2s: {},
  s2c: {
    msg: serverEvent('msg').payload(z.object({ id: z.string() })).build(),
  },
});

describe('EventMultiplexer', () => {
  it('passes valid payloads to the typed event stream', async () => {
    const raw$ = new Subject<unknown>();
    const mux = new EventMultiplexer(contract, () => raw$);
    const collected = firstValueFrom(mux.on(contract.s2c.msg).pipe(take(1), toArray()));

    raw$.next({ id: 'a' });

    expect(await collected).toEqual([{ id: 'a' }]);
  });

  it('routes invalid payloads to errors$', async () => {
    const raw$ = new Subject<unknown>();
    const mux = new EventMultiplexer(contract, () => raw$);
    const subscription = mux.on(contract.s2c.msg).subscribe();
    const error = firstValueFrom(mux.errors$.pipe(take(1)));

    raw$.next({ id: 42 });

    expect((await error).kind).toBe(WsErrorKind.InvalidPayload);
    subscription.unsubscribe();
  });
});
