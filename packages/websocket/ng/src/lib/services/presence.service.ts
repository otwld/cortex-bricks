import type { Signal } from '@angular/core';
import type { RoomId } from '@otwld/ts-websocket';
import { PresenceTracker } from '../internal/presence-tracker';
import type { UserContextSnapshot } from '../models/user-context-snapshot.model';

/**
 * Angular facade over `PresenceTracker`.
 */
export class PresenceService {
  /** @param tracker Underlying tracker. */
  public constructor(private readonly tracker: PresenceTracker) {}

  /**
   * Members of `room` from the latest broadcast.
   *
   * @param room Room id.
   */
  /**
   * Runs members.
   *
   * @param room - room value.
   *
   * @returns The presence service members result.
   */
  public members(room: RoomId): Signal<readonly UserContextSnapshot[]> {
    return this.tracker.signalFor(room);
  }
}
