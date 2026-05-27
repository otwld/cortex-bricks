import { makeEnvironmentProviders, type EnvironmentProviders, type Provider } from '@angular/core';
import { io as ioFactory } from 'socket.io-client';
import type { Contract } from '@otwld/ts-websocket';
import type { SocketIoFactory, SocketIoLike } from './internal/socket-adapter';
import type { WsConfig } from './models/ws-config.model';
import { PresenceService } from './services/presence.service';
import { WsClient } from './services/ws-client.service';
import { WS_CLIENT } from './tokens/ws-client.token';
import { WS_CONFIG } from './tokens/ws-config.token';
import { WS_CONTRACT } from './tokens/ws-contract.token';
import { WS_PRESENCE } from './tokens/ws-presence.token';

const defaultFactory: SocketIoFactory = (url, opts) => ioFactory(url, opts) as unknown as SocketIoLike;

/**
 * Register a `WsClient<TContract>` for a contract.
 *
 * @param contract Source contract.
 * @param config Client configuration.
 */
/**
 * Runs provide websocket.
 *
 * @param contract - contract value.
 *
 * @param config - config value.
 *
 * @returns The provide websocket result.
 */
export function provideWebsocket<TContract extends Contract>(
  contract: TContract,
  config: WsConfig,
): EnvironmentProviders {
  const clientToken = WS_CLIENT(contract);
  const providers: Provider[] = [
    { provide: WS_CONTRACT, useValue: contract },
    { provide: WS_CONFIG, useValue: config },
    {
      provide: clientToken,
      useFactory: () => new WsClient(contract, config, defaultFactory),
    },
    {
      provide: WS_PRESENCE(contract),
      useFactory: (client: WsClient<TContract>) => new PresenceService(client.presenceTracker),
      deps: [clientToken],
    },
  ];
  return makeEnvironmentProviders(providers);
}
