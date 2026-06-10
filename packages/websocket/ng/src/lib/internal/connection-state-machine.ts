import { ConnectionState } from '@otwld/ts-websocket';
import { BehaviorSubject, Subscription, type Observable, type Subject } from 'rxjs';

/** Inputs consumed by the state machine. */
export interface ConnectionStateMachineSources {
  /** Socket connected stream. */
  connect$: Subject<void>;
  /** Socket disconnected stream. */
  disconnect$: Subject<string>;
  /** Reconnect attempt stream. */
  reconnectAttempt$: Subject<number>;
  /** Terminal close stream. */
  closed$: Subject<void>;
}

/**
 * Drives public connection state from raw socket events.
 */
export class ConnectionStateMachine {
  private readonly state = new BehaviorSubject<ConnectionState>(ConnectionState.Disconnected);
  private readonly subscriptions = new Subscription();

  /** Observable of state transitions. */
  public readonly state$: Observable<ConnectionState> = this.state.asObservable();

  /** @param sources RxJS sources from `SocketAdapter`. */
  public constructor(sources: ConnectionStateMachineSources) {
    this.subscriptions.add(sources.connect$.subscribe(() => this.state.next(ConnectionState.Connected)));
    this.subscriptions.add(
      sources.disconnect$.subscribe(() => {
        if (this.state.value !== ConnectionState.Closed) this.state.next(ConnectionState.Disconnected);
      }),
    );
    this.subscriptions.add(sources.reconnectAttempt$.subscribe(() => this.state.next(ConnectionState.Reconnecting)));
    this.subscriptions.add(sources.closed$.subscribe(() => this.state.next(ConnectionState.Closed)));
  }

  /** Mark the start of an initial connect attempt. */
  public beginConnecting(): void {
    if (this.state.value === ConnectionState.Disconnected) {
      this.state.next(ConnectionState.Connecting);
    }
  }

  /** Current state snapshot. */
  public get current(): ConnectionState {
    return this.state.value;
  }

  /** Release stream subscriptions owned by the state machine. */
  public destroy(): void {
    this.subscriptions.unsubscribe();
    this.state.complete();
  }
}
