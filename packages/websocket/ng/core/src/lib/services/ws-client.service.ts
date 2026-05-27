import { computed, signal, type Signal } from '@angular/core';
import {
  ConnectionState,
  WsError,
  WsErrorKind,
  type C2sAckKeys,
  type C2sKeys,
  type Contract,
  type PayloadOf,
  type ResponseOf,
  type RoomId,
  type S2cKeys,
} from '@otwld/ts-websocket';
import { Subject, type Observable } from 'rxjs';
import type { EmitOptions } from '../models/emit-options.model';
import type { RoomHandle } from '../models/room-handle.model';
import { DEFAULT_RECONNECT_STRATEGY, type WsConfig } from '../models/ws-config.model';
import { AckRegistry } from '../internal/ack-registry';
import { ConnectionStateMachine } from '../internal/connection-state-machine';
import { EventMultiplexer } from '../internal/event-multiplexer';
import { PresenceTracker, type PresenceUpdatePayload } from '../internal/presence-tracker';
import { ReconnectController } from '../internal/reconnect-controller';
import { SocketAdapter, type SocketIoFactory } from '../internal/socket-adapter';

/**
 * Public websocket client. Signal-first API over a Socket.IO connection.
 *
 * @typeParam TContract Bound contract.
 */
export class WsClient<TContract extends Contract> {
  private readonly adapter: SocketAdapter;
  private readonly machine: ConnectionStateMachine;
  private readonly multiplexer: EventMultiplexer<TContract>;
  private readonly acks = new AckRegistry();
  private readonly reconnect: ReconnectController;
  private readonly errors = new Subject<WsError>();
  private readonly stateWritable = signal(ConnectionState.Disconnected);
  private readonly closed$ = new Subject<void>();

  /** Internal presence tracker exposed for `PresenceService` provider factory. */
  public readonly presenceTracker: PresenceTracker;

  /** Observable of every error produced by this client. */
  public readonly errors$: Observable<WsError> = this.errors.asObservable();
  /** Connection state signal. */
  public readonly state = this.stateWritable.asReadonly();
  /** True when fully connected. */
  public readonly connected = computed(() => this.state() === ConnectionState.Connected);
  /** Underlying transport, or null when disconnected. */
  public readonly transport: Signal<'websocket' | 'polling' | null>;
  /** Last measured latency in ms. */
  public readonly latencyMs = signal<number | null>(null);
  /** Most recent connection error. */
  public readonly connectionError = signal<Error | null>(null);
  /** Current reconnect attempt counter. */
  public readonly reconnectAttempt = signal(0);

  /**
   * @param contract Bound contract.
   * @param config Client configuration.
   * @param factory Socket.IO factory.
   */
  public constructor(
    private readonly contract: TContract,
    private readonly config: WsConfig,
    factory: SocketIoFactory,
  ) {
    this.adapter = new SocketAdapter(
      this.urlFor(contract),
      {
        transports: config.transports ?? ['websocket'],
        autoConnect: false,
      },
      factory,
    );

    const connect$ = new Subject<void>();
    const disconnect$ = new Subject<string>();
    const reconnectAttempt$ = new Subject<number>();
    this.adapter.connect$.subscribe(() => {
      this.reconnect.stop();
      this.reconnectAttempt.set(0);
      connect$.next();
    });
    this.adapter.disconnect$.subscribe((reason) => {
      disconnect$.next(reason);
      if (this.machine.current !== ConnectionState.Closed) {
        this.reconnect.start();
      }
    });
    this.adapter.error$.subscribe((err) => {
      this.connectionError.set(err);
      this.errors.next(new WsError({ kind: WsErrorKind.Transport, message: err.message }));

      const authAdapter = this.config.auth?.adapter;
      const decision =
        authAdapter?.onConnectError?.(err) ??
        (this.config.auth?.reauthOnConnectError ? 'retry' : 'silent');

      if (decision === 'retry') {
        void this.refreshTokenAndConnect();
      }
    });

    this.machine = new ConnectionStateMachine({
      connect$,
      disconnect$,
      reconnectAttempt$,
      closed$: this.closed$,
    });
    this.machine.state$.subscribe((state) => this.stateWritable.set(state));
    this.transport = computed(() =>
      this.state() === ConnectionState.Connected
        ? (this.adapter.transportName as 'websocket' | 'polling' | null)
        : null,
    );

    this.multiplexer = new EventMultiplexer<TContract>(contract, (pattern) => {
      const subject = new Subject<unknown>();
      this.adapter.event$(pattern).subscribe((value) => subject.next(value));
      return subject;
    });
    this.multiplexer.errors$.subscribe((err) => this.errors.next(err));

    this.reconnect = new ReconnectController(
      config.reconnect ?? DEFAULT_RECONNECT_STRATEGY,
      (attempt) => {
        this.reconnectAttempt.set(attempt);
        reconnectAttempt$.next(attempt);
        return this.refreshTokenAndConnect();
      },
    );

    const presence$ = new Subject<PresenceUpdatePayload>();
    this.adapter.event$('presence:update').subscribe((value) => {
      if (isPresenceUpdate(value)) presence$.next(value);
    });
    this.presenceTracker = new PresenceTracker(presence$);

    if (config.autoConnect ?? true) {
      this.machine.beginConnecting();
      void this.refreshTokenAndConnect();
    }
  }

  /** Initiate a connection. */
  public async connect(): Promise<void> {
    this.machine.beginConnecting();
    await this.refreshTokenAndConnect();
  }

  /** Close the connection. */
  public async disconnect(): Promise<void> {
    this.closed$.next();
    this.reconnect.stop();
    this.acks.flushAll(new WsError({ kind: WsErrorKind.Transport, message: 'Client closed' }));
    this.adapter.close();
  }

  /**
   * Fire-and-forget emit.
   *
   * @param event Client event definition.
   * @param payload Payload to send.
   */
  public emit<K extends C2sKeys<TContract>>(
    event: TContract['c2s'][K],
    payload: PayloadOf<TContract['c2s'][K]>,
  ): void {
    this.adapter.emit(event.pattern, payload);
  }

  /**
   * Emit and await a typed ack.
   *
   * @param event Ack-able client event definition.
   * @param payload Payload to send.
   * @param options Emit options.
   */
  /**
   * Runs emit with ack.
   *
   * @param event - event value.
   *
   * @param payload - payload value.
   *
   * @param options - options value.
   *
   * @returns The ws client emit with ack result.
   */
  public emitWithAck<K extends C2sAckKeys<TContract>>(
    event: TContract['c2s'][K],
    payload: PayloadOf<TContract['c2s'][K]>,
    options?: EmitOptions,
  ): Promise<ResponseOf<TContract['c2s'][K]>> {
    const timeoutMs = options?.timeoutMs ?? this.config.defaultAckTimeoutMs ?? 10_000;
    const handle = this.acks.register(event.pattern, timeoutMs);
    this.adapter.emitWithAckRaw(event.pattern, payload).then((response) => {
      try {
        this.acks.resolve(handle.id, event.parseResponse(response));
      } catch (err) {
        this.acks.reject(handle.id, err);
      }
    });
    return handle.promise as Promise<ResponseOf<TContract['c2s'][K]>>;
  }

  /**
   * Stream validated payloads for an s2c event.
   *
   * @param event Server event definition.
   */
  /**
   * Runs on.
   *
   * @param event - event value.
   *
   * @returns The ws client on result.
   */
  public on<K extends S2cKeys<TContract>>(
    event: TContract['s2c'][K],
  ): Observable<PayloadOf<TContract['s2c'][K]>> {
    return this.multiplexer.on(event);
  }

  /**
   * Build a latest-value signal for an s2c event.
   *
   * @param event Server event definition.
   * @param initialValue Initial value.
   */
  /**
   * Runs signal.
   *
   * @param event - event value.
   *
   * @param initialValue - initial value value.
   *
   * @returns The ws client signal result.
   */
  public signal<K extends S2cKeys<TContract>>(
    event: TContract['s2c'][K],
    initialValue: PayloadOf<TContract['s2c'][K]>,
  ): Signal<PayloadOf<TContract['s2c'][K]>> {
    const current = signal(initialValue);
    this.on(event).subscribe((value) => current.set(value));
    return current.asReadonly();
  }

  /**
   * Build a room handle.
   *
   * @param id Room id.
   */
  /**
   * Runs room.
   *
   * @param id - id value.
   *
   * @returns The ws client room result.
   */
  public room(id: RoomId): RoomHandle<TContract> {
    const joined = signal(false);
    const members = this.presenceTracker.signalFor(id);
    const memberCount = computed(() => members().length);
    return {
      id,
      joined: joined.asReadonly(),
      members,
      memberCount,
      _contract: this.contract,
      join: async () => {
        const def = this.findRoomDef('room.join');
        await this.emitWithAck(def, { roomId: id } as never);
        joined.set(true);
      },
      leave: async () => {
        const def = this.findRoomDef('room.leave');
        await this.emitWithAck(def, { roomId: id } as never);
        joined.set(false);
      },
    };
  }

  private async refreshTokenAndConnect(): Promise<void> {
    const authAdapter = this.config.auth?.adapter;
    if (authAdapter) {
      this.adapter.setAuth({ token: await authAdapter.getToken() });
    }
    this.adapter.connect();
  }

  private urlFor(contract: TContract): string {
    const base = this.config.url.replace(/\/$/, '');
    const namespace = contract.namespace.startsWith('/') ? contract.namespace : `/${contract.namespace}`;
    return `${base}${namespace}`;
  }

  private findRoomDef(pattern: 'room.join' | 'room.leave'): TContract['c2s'][C2sAckKeys<TContract>] {
    for (const def of Object.values(this.contract.c2s)) {
      if (def.pattern === pattern) return def as TContract['c2s'][C2sAckKeys<TContract>];
    }
    throw new WsError({
      kind: WsErrorKind.PatternMismatch,
      message: `Contract is missing "${pattern}" - add withRoomManagement().`,
      pattern,
    });
  }
}

function isPresenceUpdate(value: unknown): value is PresenceUpdatePayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'room' in value &&
    'members' in value &&
    Array.isArray((value as { members: unknown }).members)
  );
}
