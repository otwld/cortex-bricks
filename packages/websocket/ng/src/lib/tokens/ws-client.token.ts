import { InjectionToken } from '@angular/core';
import type { Contract } from '@otwld/ts-websocket';
import type { WsClient } from '../services/ws-client.service';

const cache = new WeakMap<Contract, InjectionToken<WsClient<Contract>>>();

/**
 * Per-contract injection token factory.
 *
 * @param contract Contract whose client should be injected.
 */
export function WS_CLIENT<TContract extends Contract>(
  contract: TContract,
): InjectionToken<WsClient<TContract>> {
  let token = cache.get(contract);
  if (!token) {
    token = new InjectionToken<WsClient<Contract>>(`WS_CLIENT(${contract.namespace})`);
    cache.set(contract, token);
  }
  return token as InjectionToken<WsClient<TContract>>;
}
