import { ConnectionState } from '@otwld/ts-websocket';
import { firstValueFrom, Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ConnectionStateMachine } from './connection-state-machine';

describe('ConnectionStateMachine', () => {
  it('transitions from disconnected through reconnecting to closed', async () => {
    const connect$ = new Subject<void>();
    const disconnect$ = new Subject<string>();
    const reconnectAttempt$ = new Subject<number>();
    const closed$ = new Subject<void>();

    const machine = new ConnectionStateMachine({
      connect$,
      disconnect$,
      reconnectAttempt$,
      closed$,
    });
    const states: ConnectionState[] = [];
    machine.state$.subscribe((state) => states.push(state));

    machine.beginConnecting();
    connect$.next();
    disconnect$.next('transport close');
    reconnectAttempt$.next(1);
    connect$.next();
    closed$.next();

    expect(states).toEqual([
      ConnectionState.Disconnected,
      ConnectionState.Connecting,
      ConnectionState.Connected,
      ConnectionState.Disconnected,
      ConnectionState.Reconnecting,
      ConnectionState.Connected,
      ConnectionState.Closed,
    ]);
    await expect(firstValueFrom(machine.state$)).resolves.toBe(ConnectionState.Closed);
  });
});
