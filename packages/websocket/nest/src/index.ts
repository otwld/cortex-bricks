export * from '@otwld/ts-websocket';

export { WebsocketLifecycle, WebsocketModule } from './lib/websocket.module';
export {
  type WebsocketCorsOptions,
  type WebsocketLoggerOptions,
  type WebsocketModuleOptions,
  type WebsocketPresenceOptions,
} from './lib/config/websocket-module-options';

export {
  WsAuthAdapter,
  type AuthenticatedSocket,
} from './lib/adapters/ws-auth-adapter';
export { NoopScalingAdapter } from './lib/adapters/noop-scaling.adapter';
export { WsScalingAdapter } from './lib/adapters/ws-scaling-adapter';
export {
  createWebsocketIoAdapter,
  WebsocketIoAdapter,
} from './lib/adapters/websocket-io.adapter';

export {
  getTypedGatewayContract,
  TypedGateway,
  type TypedGatewayOptions,
} from './lib/decorators/typed-gateway.decorator';
export { getOnEventDef, OnEvent } from './lib/decorators/on-event.decorator';
export { CurrentRoom } from './lib/decorators/current-room.decorator';
export { CurrentSocketUser } from './lib/decorators/current-socket-user.decorator';
export { WsPayload } from './lib/decorators/ws-payload.decorator';

export { WsValidationException } from './lib/exceptions/ws-validation.exception';

export { RoomManagementGateway } from './lib/gateway/room-management.gateway';
export { TypedServerRegistry } from './lib/gateway/typed-server-registry';
export {
  TypedServer,
  type TypedRoomEmitter,
  type TypedServerOptions,
} from './lib/gateway/typed-server';
export {
  provideTypedServer,
  TYPED_SERVER,
} from './lib/tokens/typed-server.token';

export { InMemoryPresenceStore } from './lib/presence/in-memory-presence.store';
export { PresenceService } from './lib/presence/presence.service';
export { PresenceStore } from './lib/presence/presence-store';

export * from './lib/redis/redis-presence.store';
export * from './lib/redis/redis-scaling.adapter';
