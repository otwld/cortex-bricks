// Re-export shared common types so consumers do not need a second import.
export * from '@otwld/ts-websocket';

export { WS_CONFIG } from './lib/tokens/ws-config.token';
export { WS_CONTRACT } from './lib/tokens/ws-contract.token';
export { WS_CLIENT } from './lib/tokens/ws-client.token';
export { WS_PRESENCE } from './lib/tokens/ws-presence.token';

export { DEFAULT_RECONNECT_STRATEGY } from './lib/models/ws-config.model';
export type { WsConfig } from './lib/models/ws-config.model';
export type { ReconnectStrategy } from './lib/models/reconnect-strategy.model';
export type { EmitOptions } from './lib/models/emit-options.model';
export type { UserContextSnapshot } from './lib/models/user-context-snapshot.model';
export type { RoomHandle } from './lib/models/room-handle.model';

export { WsClientError } from './lib/exceptions/ws-client-error';

export { WsAuthAdapter } from './lib/services/ws-auth.adapter';
export { BearerTokenWsAuthAdapter } from './lib/services/bearer-token-ws-auth.adapter';
export { PresenceService } from './lib/services/presence.service';
export { WsClient } from './lib/services/ws-client.service';

export { WsConnectedDirective } from './lib/directives/ws-connected.directive';

export { provideWebsocket } from './lib/provide-websocket';
