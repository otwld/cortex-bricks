import type { ClientEventGroup, Contract, ServerEventGroup } from './define-contract';
import type { ClientEventDef, ServerEventDef } from './event-def';

/**
 * Generate a `ClientToServerEvents` interface compatible with Socket.IO's
 * native typed-events API from a `Contract`.
 *
 * Events are keyed by their wire-level pattern. Ack-able events take a
 * callback argument; fire-and-forget events take only the payload.
 *
 * @typeParam TContract Source contract.
 */
export type InferClientToServer<TContract extends Contract> = {
  [K in keyof TContract['c2s'] as TContract['c2s'][K]['pattern']]: TContract['c2s'][K] extends ClientEventDef<
    infer _P,
    infer Payload,
    infer Response
  >
    ? [Response] extends [void]
      ? (payload: Payload) => void
      : (payload: Payload, ack: (response: Response) => void) => void
    : never;
};

/**
 * Generate a `ServerToClientEvents` interface compatible with Socket.IO's
 * native typed-events API from a `Contract`.
 *
 * @typeParam TContract Source contract.
 */
export type InferServerToClient<TContract extends Contract> = {
  [K in keyof TContract['s2c'] as TContract['s2c'][K]['pattern']]: TContract['s2c'][K] extends ServerEventDef<
    infer _P,
    infer Payload
  >
    ? (payload: Payload) => void
    : never;
};

/**
 * Keys of `c2s` whose definitions have a response schema (ack-able).
 *
 * Used to constrain `WsClient.emitWithAck` and typed gateway return checks.
 *
 * @typeParam TContract Source contract.
 */
export type C2sAckKeys<TContract extends Contract> = {
  [K in keyof TContract['c2s']]: TContract['c2s'][K] extends ClientEventDef<
    string,
    unknown,
    infer R
  >
    ? [R] extends [void]
      ? never
      : K
    : never;
}[keyof TContract['c2s']];

/**
 * All keys in `c2s`.
 *
 * @typeParam TContract Source contract.
 */
export type C2sKeys<TContract extends Contract> = keyof TContract['c2s'];

/**
 * All keys in `s2c`.
 *
 * @typeParam TContract Source contract.
 */
export type S2cKeys<TContract extends Contract> = keyof TContract['s2c'];

export type { ClientEventGroup, ServerEventGroup };
