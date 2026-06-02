import { InjectionToken } from '@angular/core';
import type { Contract } from '@otwld/ts-websocket';
import { PresenceService } from '../services/presence.service';

const cache = new WeakMap<Contract, InjectionToken<PresenceService>>();

/**
 * Injection token for a contract-scoped `PresenceService`.
 *
 * @param contract Contract associated with the presence stream.
 */
/**
 * Runs ws presence.
 *
 * @param contract - contract value.
 *
 * @returns The ws presence result.
 */
export function WS_PRESENCE<TContract extends Contract>(
  contract: TContract,
): InjectionToken<PresenceService> {
  let token = cache.get(contract);
  if (!token) {
    token = new InjectionToken<PresenceService>(`WS_PRESENCE(${contract.namespace})`);
    cache.set(contract, token);
  }
  return token;
}
