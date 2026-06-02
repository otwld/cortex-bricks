import { signal, type Signal, type WritableSignal } from '@angular/core';
import type { RoomId } from '@otwld/ts-websocket';
import type { Observable } from 'rxjs';
import type { UserContextSnapshot } from '../models/user-context-snapshot.model';

/** Shape of the `presence:update` broadcast payload. */
export interface PresenceUpdatePayload {
  /** Room id. */
  room: RoomId;
  /** Current members. */
  members: readonly UserContextSnapshot[];
}

/**
 * Tracks presence broadcasts and exposes per-room signals.
 */
export class PresenceTracker {
  private readonly perRoom = new Map<RoomId, WritableSignal<readonly UserContextSnapshot[]>>();

  /**
   * @param stream$ Observable of presence updates.
   */
  public constructor(stream$: Observable<PresenceUpdatePayload>) {
    stream$.subscribe(({ room, members }) => this.ensure(room).set([...members]));
  }

  /**
   * Read-only signal of members for a room.
   *
   * @param room Room id.
   */
  public signalFor(room: RoomId): Signal<readonly UserContextSnapshot[]> {
    return this.ensure(room).asReadonly();
  }

  private ensure(room: RoomId): WritableSignal<readonly UserContextSnapshot[]> {
    let sig = this.perRoom.get(room);
    if (!sig) {
      sig = signal<readonly UserContextSnapshot[]>([]);
      this.perRoom.set(room, sig);
    }
    return sig;
  }
}
