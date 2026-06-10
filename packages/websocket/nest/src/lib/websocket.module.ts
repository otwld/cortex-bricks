import {
  Inject,
  Injectable,
  Module,
  type DynamicModule,
  type OnApplicationShutdown,
  type Type,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  WsException,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Namespace, Server, Socket } from 'socket.io';
import {
  type ClientEventDef,
  type RoomId,
  type UserContext,
  WsErrorKind,
  WsValidationError,
  withRoomManagement,
} from '@otwld/ts-websocket';
import { NoopScalingAdapter } from './adapters/noop-scaling.adapter';
import { type AuthenticatedSocket, WsAuthAdapter } from './adapters/ws-auth-adapter';
import { WsScalingAdapter } from './adapters/ws-scaling-adapter';
import {
  ConfigurableModuleClass,
  type ASYNC_OPTIONS_TYPE,
  WEBSOCKET_MODULE_OPTIONS,
  type OPTIONS_TYPE,
} from './config/websocket.module-definition';
import {
  resolveWebsocketModuleOptions,
  type ResolvedWebsocketModuleOptions,
  type WebsocketModuleOptions,
} from './config/websocket-module-options';
import {
  getTypedGatewayContract,
  TYPED_GATEWAY_OPTIONS,
  type TypedGatewayOptions,
} from './decorators/typed-gateway.decorator';
import { getOnEventDef } from './decorators/on-event.decorator';
import { WsValidationException } from './exceptions/ws-validation.exception';
import {
  buildHandshakeContext,
  getConnectionContext,
  scheduleTokenExpiry,
  setWebsocketLifecycleDelegate,
} from './gateway/connection-context';
import { TypedServerRegistry } from './gateway/typed-server-registry';
import { InMemoryPresenceStore } from './presence/in-memory-presence.store';
import { PresenceService } from './presence/presence.service';
import { PresenceStore } from './presence/presence-store';
import { WS_RESOLVED_OPTIONS, WS_SCALING_ADAPTER } from './tokens';

interface NamespaceInitializationState {
  requireAuth: boolean;
  customRoomManagementPatterns: Set<string>;
}

/**
 * Lifecycle handler registered by `WebsocketModule`.
 */
@Injectable()
export class WebsocketLifecycle
  implements OnGatewayConnection, OnGatewayDisconnect, OnApplicationShutdown
{
  private scalingInstallPromise: Promise<void> | null = null;
  private scalingDisposed = false;
  private readonly namespaceStates = new WeakMap<Namespace, NamespaceInitializationState>();
  private readonly installedRoomManagementHandlers = new WeakMap<Socket, Set<string>>();

  /**
   * @param resolved Resolved module options.
   * @param authAdapter Auth adapter instance.
   * @param presence Presence service.
   * @param typedServerRegistry Registry for namespace-scoped typed servers.
   * @param scalingAdapter Scaling adapter instance.
   */
  public constructor(
    @Inject(WS_RESOLVED_OPTIONS) private readonly resolved: ResolvedWebsocketModuleOptions,
    private readonly authAdapter: WsAuthAdapter,
    private readonly presence: PresenceService,
    private readonly typedServerRegistry: TypedServerRegistry,
    @Inject(WS_SCALING_ADAPTER) private readonly scalingAdapter: WsScalingAdapter,
  ) {
    setWebsocketLifecycleDelegate(this);
  }

  /**
   * Initialize namespace-level middleware and shared infrastructure.
   *
   * @param serverOrNamespace Socket.IO server or namespace passed by Nest.
   * @param gateway Gateway instance, when invoked from `@TypedGateway` hooks.
   */
  public async handleInit(serverOrNamespace: unknown, gateway?: object): Promise<void> {
    const namespace = this.namespaceFrom(serverOrNamespace, gateway);
    if (!namespace) return;

    const contract = gateway ? getTypedGatewayContract(gateway) : undefined;
    if (contract) this.typedServerRegistry.register(contract.namespace, namespace);

    const scalingInstall = this.ensureScalingInstalled(namespace.server);
    const gatewayOptions = this.gatewayOptionsFor(gateway);
    const requiresAuth = gatewayOptions?.requireAuth ?? true;
    const state = this.namespaceStates.get(namespace);

    if (state) {
      state.requireAuth ||= requiresAuth;
      this.recordGatewayRoomManagementHandlers(state, gateway);
      await scalingInstall;
      return;
    }

    const namespaceState = {
      requireAuth: requiresAuth,
      customRoomManagementPatterns: new Set<string>(),
    };
    this.recordGatewayRoomManagementHandlers(namespaceState, gateway);
    this.namespaceStates.set(namespace, namespaceState);
    namespace.use(async (socket, next) => {
      try {
        const user = await this.authAdapter.authenticate(buildHandshakeContext(socket));
        if (!user && namespaceState.requireAuth) {
          next(new Error('Unauthorized'));
          return;
        }
        if (user) this.applyAuthenticatedContext(socket, user);
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });

    await scalingInstall;
  }

  /**
   * Initialize a connected socket.
   *
   * @param socket Connected socket.
   * @param gateway Gateway instance, when invoked from `@TypedGateway` hooks.
   */
  public async handleConnection(socket: Socket, gateway?: object): Promise<void> {
    const context = getConnectionContext(socket);
    const user = context.user;

    if (!user) {
      this.installRoomManagementHandlers(socket, gateway);
      return;
    }

    const releaseRoomManagementPackets = this.deferRoomManagementPackets(socket, gateway);

    if (this.authAdapter.resolveRooms) {
      const rooms = await this.authAdapter.resolveRooms(user);
      for (const room of rooms) {
        await socket.join(room);
        await this.presence.recordJoin(room, socket.id, user);
        await this.maybeBroadcastPresence(socket.nsp, room);
      }
    }

    this.installRoomManagementHandlers(socket, gateway);
    releaseRoomManagementPackets?.();
  }

  /**
   * Clear timers and presence records for a disconnected socket.
   *
   * @param socket Disconnected socket.
   */
  public async handleDisconnect(socket: Socket): Promise<void> {
    const context = getConnectionContext(socket);
    if (context.reauthTimer) clearTimeout(context.reauthTimer);

    const rooms = await this.presence.dropSocket(socket.id);
    for (const room of rooms) {
      await this.maybeBroadcastPresence(socket.nsp, room);
    }
  }

  /** Dispose shared scaling resources during Nest shutdown. */
  public async onApplicationShutdown(): Promise<void> {
    const scalingInstall = this.scalingInstallPromise;
    if (!scalingInstall || this.scalingDisposed) return;
    await scalingInstall;
    if (this.scalingDisposed) return;
    this.scalingDisposed = true;
    await this.scalingAdapter.dispose();
  }

  private ensureScalingInstalled(server: Server): Promise<void> {
    if (!this.scalingInstallPromise) {
      const install = this.scalingAdapter.install(server);
      const guarded = install.catch((err: unknown) => {
        if (this.scalingInstallPromise === guarded) this.scalingInstallPromise = null;
        throw err;
      });
      this.scalingInstallPromise = guarded;
    }
    return this.scalingInstallPromise;
  }

  private namespaceFrom(serverOrNamespace: unknown, gateway?: object): Namespace | undefined {
    if (this.isNamespace(serverOrNamespace)) return serverOrNamespace;
    if (!this.isServer(serverOrNamespace) || !gateway) return undefined;

    const contract = getTypedGatewayContract(gateway);
    if (!contract) return undefined;
    return serverOrNamespace.of(contract.namespace);
  }

  private isNamespace(value: unknown): value is Namespace {
    return (
      typeof value === 'object' &&
      value !== null &&
      'server' in value &&
      typeof (value as { use?: unknown }).use === 'function'
    );
  }

  private isServer(value: unknown): value is Server {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as { of?: unknown }).of === 'function'
    );
  }

  private applyAuthenticatedContext(socket: Socket, user: UserContext): void {
    const context = getConnectionContext(socket);
    context.user = user;
    const exp = (user.claims as { exp?: unknown }).exp;
    if (typeof exp === 'number') {
      const expiresAt = new Date(exp * 1000);
      context.tokenExpiresAt = expiresAt;
      context.reauthTimer = scheduleTokenExpiry(expiresAt, async () => {
        const decision =
          (await this.authAdapter.onTokenExpired?.(socket as AuthenticatedSocket)) ?? 'disconnect';
        if (decision === 'disconnect') socket.disconnect(true);
      });
    }
  }

  private gatewayOptionsFor(gateway: object | undefined): TypedGatewayOptions | undefined {
    if (!gateway) return undefined;
    return Reflect.getMetadata(TYPED_GATEWAY_OPTIONS, gateway.constructor) as
      | TypedGatewayOptions
      | undefined;
  }

  private installRoomManagementHandlers(socket: Socket, gateway?: object): void {
    const contract = gateway ? getTypedGatewayContract(gateway) : undefined;
    if (!contract) return;

    const joinDef = Object.values(contract.c2s).find(
      (def) => def.pattern === withRoomManagement.JOIN_PATTERN,
    );
    const leaveDef = Object.values(contract.c2s).find(
      (def) => def.pattern === withRoomManagement.LEAVE_PATTERN,
    );

    if (joinDef && !this.namespaceHasRoomManagementHandler(socket.nsp, gateway, joinDef.pattern)) {
      this.installRoomManagementHandler(socket, joinDef, async (payload) => {
        const { roomId } = payload as { roomId: RoomId };
        await socket.join(roomId);
        const user = getConnectionContext(socket).user;
        if (user) await this.presence.recordJoin(roomId, socket.id, user);
        await this.maybeBroadcastPresence(socket.nsp, roomId);
      });
    }

    if (leaveDef && !this.namespaceHasRoomManagementHandler(socket.nsp, gateway, leaveDef.pattern)) {
      this.installRoomManagementHandler(socket, leaveDef, async (payload) => {
        const { roomId } = payload as { roomId: RoomId };
        await socket.leave(roomId);
        await this.presence.recordLeave(roomId, socket.id);
        await this.maybeBroadcastPresence(socket.nsp, roomId);
      });
    }
  }

  private deferRoomManagementPackets(socket: Socket, gateway?: object): (() => void) | undefined {
    const contract = gateway ? getTypedGatewayContract(gateway) : undefined;
    if (!contract) return undefined;

    const patterns = new Set<string>();
    for (const def of Object.values(contract.c2s)) {
      if (
        (def.pattern === withRoomManagement.JOIN_PATTERN ||
          def.pattern === withRoomManagement.LEAVE_PATTERN) &&
        !this.namespaceHasRoomManagementHandler(socket.nsp, gateway, def.pattern)
      ) {
        patterns.add(def.pattern);
      }
    }
    if (patterns.size === 0) return undefined;

    let release: (() => void) | undefined;
    const ready = new Promise<void>((resolve) => {
      release = resolve;
    });

    socket.use((packet, next) => {
      const pattern = packet[0];
      if (typeof pattern !== 'string' || !patterns.has(pattern)) {
        next();
        return;
      }

      void ready.then(() => next());
    });

    return release;
  }

  private installRoomManagementHandler(
    socket: Socket,
    def: ClientEventDef<string, unknown, unknown>,
    handle: (payload: unknown) => Promise<void>,
  ): void {
    let installed = this.installedRoomManagementHandlers.get(socket);
    if (!installed) {
      installed = new Set();
      this.installedRoomManagementHandlers.set(socket, installed);
    }
    if (installed.has(def.pattern)) return;
    installed.add(def.pattern);

    socket.on(def.pattern, async (payload: unknown, ack?: (value: unknown) => void) => {
      try {
        const parsed = def.parse(payload);
        await handle(parsed);
        ack?.({ ok: true });
      } catch (err) {
        socket.emit('exception', this.websocketExceptionPayload(err, def.pattern));
      }
    });
  }

  private recordGatewayRoomManagementHandlers(
    state: NamespaceInitializationState,
    gateway: object | undefined,
  ): void {
    if (!gateway) return;
    for (const pattern of [
      withRoomManagement.JOIN_PATTERN,
      withRoomManagement.LEAVE_PATTERN,
    ] as const) {
      if (this.gatewayHasHandler(gateway, pattern)) {
        state.customRoomManagementPatterns.add(pattern);
      }
    }
  }

  private namespaceHasRoomManagementHandler(
    namespace: Namespace,
    gateway: object | undefined,
    pattern: string,
  ): boolean {
    return (
      this.namespaceStates.get(namespace)?.customRoomManagementPatterns.has(pattern) ??
      this.gatewayHasHandler(gateway, pattern)
    );
  }

  private gatewayHasHandler(gateway: object | undefined, pattern: string): boolean {
    if (!gateway) return false;

    let prototype = Object.getPrototypeOf(gateway) as object | null;
    while (prototype && prototype !== Object.prototype) {
      for (const key of Object.getOwnPropertyNames(prototype)) {
        const method = Object.getOwnPropertyDescriptor(prototype, key)?.value;
        if (typeof method !== 'function') continue;
        if (getOnEventDef(method)?.pattern === pattern) return true;
      }
      prototype = Object.getPrototypeOf(prototype) as object | null;
    }

    return false;
  }

  private websocketExceptionPayload(err: unknown, pattern: string): unknown {
    if (err instanceof WsException) return err.getError();
    if (err instanceof WsValidationError) {
      return new WsValidationException({
        kind: WsErrorKind.InvalidPayload,
        message: err.message,
        pattern,
        issues: err.issues,
      }).getError();
    }
    if (err instanceof Error) return { message: err.message };
    return { message: 'Websocket handler failed' };
  }

  private async maybeBroadcastPresence(namespace: Namespace, room: RoomId): Promise<void> {
    if (!this.resolved.presence.autoBroadcast) return;
    const members = await this.presence.members(room);
    namespace.to(room).emit(this.resolved.presence.eventName, {
      room,
      members: members.map((member) => ({ id: member.id })),
    });
  }
}

/**
 * Root websocket module.
 */
@Module({})
export class WebsocketModule extends ConfigurableModuleClass {
  /**
   * Register websocket services synchronously.
   *
   * @param options Module options.
   */
  public static override forRoot(options: typeof OPTIONS_TYPE): DynamicModule {
    const resolved = resolveWebsocketModuleOptions(options);
    return this.composeModule(resolved, options.authAdapter, super.forRoot(options));
  }

  /**
   * Register websocket services asynchronously.
   *
   * This preserves Nest's configurable module API. Resolved defaults are
   * applied lazily by the options provider for the common synchronous path.
   *
   * @param options Async options from `ConfigurableModuleBuilder`.
   */
  public static override forRootAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    return this.composeAsyncModule(super.forRootAsync(options));
  }

  private static composeModule(
    resolved: ResolvedWebsocketModuleOptions,
    authAdapter: Type<WsAuthAdapter>,
    base: DynamicModule,
  ): DynamicModule {
    return {
      ...base,
      providers: [
        ...(base.providers ?? []),
        { provide: WS_RESOLVED_OPTIONS, useValue: resolved },
        { provide: WS_SCALING_ADAPTER, useValue: resolved.scalingAdapter ?? new NoopScalingAdapter() },
        { provide: WsScalingAdapter, useExisting: WS_SCALING_ADAPTER },
        { provide: WsAuthAdapter, useClass: authAdapter },
        { provide: PresenceStore, useClass: InMemoryPresenceStore },
        PresenceService,
        TypedServerRegistry,
        WebsocketLifecycle,
      ],
      exports: [
        ...(base.exports ?? []),
        WS_RESOLVED_OPTIONS,
        WS_SCALING_ADAPTER,
        WsScalingAdapter,
        WsAuthAdapter,
        PresenceStore,
        PresenceService,
        TypedServerRegistry,
        WebsocketLifecycle,
      ],
    };
  }

  private static composeAsyncModule(base: DynamicModule): DynamicModule {
    return {
      ...base,
      providers: [
        ...(base.providers ?? []),
        {
          provide: WS_RESOLVED_OPTIONS,
          useFactory: (options: WebsocketModuleOptions) => resolveWebsocketModuleOptions(options),
          inject: [WEBSOCKET_MODULE_OPTIONS],
        },
        {
          provide: WS_SCALING_ADAPTER,
          useFactory: (resolved: ResolvedWebsocketModuleOptions) =>
            resolved.scalingAdapter ?? new NoopScalingAdapter(),
          inject: [WS_RESOLVED_OPTIONS],
        },
        { provide: WsScalingAdapter, useExisting: WS_SCALING_ADAPTER },
        {
          provide: WsAuthAdapter,
          useFactory: async (options: WebsocketModuleOptions, moduleRef: ModuleRef) =>
            moduleRef.create(options.authAdapter),
          inject: [WEBSOCKET_MODULE_OPTIONS, ModuleRef],
        },
        { provide: PresenceStore, useClass: InMemoryPresenceStore },
        PresenceService,
        TypedServerRegistry,
        WebsocketLifecycle,
      ],
      exports: [
        ...(base.exports ?? []),
        WS_RESOLVED_OPTIONS,
        WS_SCALING_ADAPTER,
        WsScalingAdapter,
        WsAuthAdapter,
        PresenceStore,
        PresenceService,
        TypedServerRegistry,
        WebsocketLifecycle,
      ],
    };
  }
}

export type { WebsocketModuleOptions };
