import type { Signal } from '@angular/core';
import type { Contract, RoomId } from '@otwld/ts-websocket';
import type { UserContextSnapshot } from './user-context-snapshot.model';

/**
 * Per-room reactive handle returned by `WsClient.room(id)`.
 *
 * @typeParam TContract Owning contract type.
 */
export interface RoomHandle<TContract extends Contract> {
  /** Room id. */
  readonly id: RoomId;
  /** True while the underlying socket reports membership. */
  readonly joined: Signal<boolean>;
  /** Members from the most recent presence broadcast. */
  readonly members: Signal<readonly UserContextSnapshot[]>;
  /** Derived member count. */
  readonly memberCount: Signal<number>;
  /** Send the `joinRoom` event from the contract. */
  join(): Promise<void>;
  /** Send the `leaveRoom` event from the contract. */
  leave(): Promise<void>;
  /** Phantom field used for type inference. */
  readonly _contract: TContract;
}
