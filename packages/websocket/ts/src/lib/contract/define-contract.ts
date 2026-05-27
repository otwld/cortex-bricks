import type { ClientEventDef, ServerEventDef } from './event-def';

/**
 * Map of c2s definitions keyed by semantic name.
 */
export type ClientEventGroup = Readonly<Record<string, ClientEventDef<string, unknown, unknown>>>;

/**
 * Map of s2c definitions keyed by semantic name.
 */
export type ServerEventGroup = Readonly<Record<string, ServerEventDef<string, unknown>>>;

/**
 * Input shape for `defineContract`.
 *
 * @typeParam TC2s Inferred c2s group.
 * @typeParam TS2c Inferred s2c group.
 */
export interface ContractInput<TC2s extends ClientEventGroup, TS2c extends ServerEventGroup> {
  /** Optional Socket.IO namespace path. Defaults to `/`. */
  namespace?: string;
  /** Client to Server events. */
  c2s: TC2s;
  /** Server to Client events. */
  s2c: TS2c;
}

/**
 * Final contract shape produced by `defineContract`.
 *
 * @typeParam TC2s Inferred c2s group.
 * @typeParam TS2c Inferred s2c group.
 */
export interface Contract<
  TC2s extends ClientEventGroup = ClientEventGroup,
  TS2c extends ServerEventGroup = ServerEventGroup,
> {
  /** Socket.IO namespace path. */
  readonly namespace: string;
  /** Client to Server events. */
  readonly c2s: TC2s;
  /** Server to Client events. */
  readonly s2c: TS2c;
}

/**
 * Group two `c2s` and `s2c` event groups under a single namespace.
 *
 * Throws if any pattern is duplicated across or within groups.
 *
 * @param input Contract input.
 */
/**
 * Runs define contract.
 *
 * @param input - input value.
 *
 * @returns The define contract result.
 *
 * @throws When the operation cannot be completed.
 */
export function defineContract<
  const TC2s extends ClientEventGroup,
  const TS2c extends ServerEventGroup,
>(input: ContractInput<TC2s, TS2c>): Contract<TC2s, TS2c> {
  const seen = new Set<string>();
  const all = [...Object.values(input.c2s), ...Object.values(input.s2c)];

  for (const def of all) {
    if (seen.has(def.pattern)) {
      throw new Error(`defineContract: duplicate pattern "${def.pattern}"`);
    }
    seen.add(def.pattern);
  }

  return {
    namespace: input.namespace ?? '/',
    c2s: input.c2s,
    s2c: input.s2c,
  };
}
