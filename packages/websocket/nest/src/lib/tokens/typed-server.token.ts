import type { Provider } from '@nestjs/common';
import type { Contract } from '@otwld/ts-websocket';
import type { ResolvedWebsocketModuleOptions } from '../config/websocket-module-options';
import { TypedServer } from '../gateway/typed-server';
import { TypedServerRegistry } from '../gateway/typed-server-registry';
import { WS_RESOLVED_OPTIONS } from '../tokens';

const typedServerTokens = new WeakMap<Contract, symbol>();

/**
 * Injection token for a contract-scoped `TypedServer`.
 *
 * @param contract Contract served by the typed server.
 */
/**
 * Runs typed server.
 *
 * @param contract - contract value.
 *
 * @returns The typed server result.
 */
export function TYPED_SERVER<TContract extends Contract>(contract: TContract): symbol {
  let token = typedServerTokens.get(contract);
  if (!token) {
    token = Symbol.for(`@otwld/nest-websocket:typed-server:${contract.namespace}`);
    typedServerTokens.set(contract, token);
  }
  return token;
}

/**
 * Provider factory for a contract-scoped `TypedServer`.
 *
 * @param contract Contract served by the typed server.
 */
/**
 * Runs provide typed server.
 *
 * @param contract - contract value.
 *
 * @returns The provide typed server result.
 */
export function provideTypedServer<TContract extends Contract>(contract: TContract): Provider {
  return {
    provide: TYPED_SERVER(contract),
    useFactory: (
      registry: TypedServerRegistry,
      resolved: ResolvedWebsocketModuleOptions,
    ): TypedServer<TContract> =>
      new TypedServer(contract, registry, {
        validateOutgoing: resolved.validateOutgoingPayloads,
      }),
    inject: [TypedServerRegistry, WS_RESOLVED_OPTIONS],
  };
}
