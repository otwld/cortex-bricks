import { Injectable } from '@nestjs/common';
import type { RoomId, UserContext } from '@otwld/ts-websocket';
import { Subject, type Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { PresenceStore } from './presence-store';

interface PresenceEvent {
  type: 'join' | 'leave';
  room: RoomId;
  user: UserContext;
  socketId: string;
}

/**
 * High-level presence service used by gateways.
 */
@Injectable()
export class PresenceService {
  private readonly events$ = new Subject<PresenceEvent>();

  /**
   * @param store Backing presence store.
   */
  public constructor(private readonly store: PresenceStore) {}

  /**
   * Record a join.
   *
   * @param room Room id.
   * @param socketId Socket id.
   * @param user Authenticated user.
   */
  public async recordJoin(room: RoomId, socketId: string, user: UserContext): Promise<void> {
    await this.store.addMember(room, socketId, user);
    this.events$.next({ type: 'join', room, user, socketId });
  }

  /**
   * Record a leave.
   *
   * @param room Room id.
   * @param socketId Socket id.
   */
  public async recordLeave(room: RoomId, socketId: string): Promise<void> {
    const departing = await this.store.removeMember(room, socketId);
    if (departing) this.events$.next({ type: 'leave', room, user: departing, socketId });
  }

  /**
   * Drop every record for a socket.
   *
   * @param socketId Socket id.
   */
  /**
   * Runs drop socket.
   *
   * @param socketId - socket id value.
   *
   * @returns The presence service drop socket result.
   */
  public async dropSocket(socketId: string): Promise<readonly RoomId[]> {
    return this.store.removeSocket(socketId);
  }

  /**
   * Stream join events for a room.
   *
   * @param room Room id.
   */
  /**
   * Runs on join.
   *
   * @param room - room value.
   *
   * @returns The presence service on join result.
   */
  public onJoin(room: RoomId): Observable<UserContext> {
    return this.events$.pipe(
      filter((event) => event.type === 'join' && event.room === room),
      map((event) => event.user),
    );
  }

  /**
   * Stream leave events for a room.
   *
   * @param room Room id.
   */
  /**
   * Runs on leave.
   *
   * @param room - room value.
   *
   * @returns The presence service on leave result.
   */
  public onLeave(room: RoomId): Observable<UserContext> {
    return this.events$.pipe(
      filter((event) => event.type === 'leave' && event.room === room),
      map((event) => event.user),
    );
  }

  /** Proxy: members of `room`. */
  /**
   * Runs members.
   *
   * @param room - room value.
   *
   * @returns The presence service members result.
   */
  public members(room: RoomId): Promise<readonly UserContext[]> {
    return this.store.members(room);
  }

  /** Proxy: rooms that `userId` is in. */
  /**
   * Runs rooms of.
   *
   * @param userId - user id value.
   *
   * @returns The presence service rooms of result.
   */
  public roomsOf(userId: string): Promise<readonly RoomId[]> {
    return this.store.roomsOf(userId);
  }

  /** Proxy: whether `userId` is online. */
  /**
   * Runs is online.
   *
   * @param userId - user id value.
   *
   * @returns The presence service is online result.
   */
  public isOnline(userId: string): Promise<boolean> {
    return this.store.isOnline(userId);
  }

  /** Proxy: every distinct online user. */
  /**
   * Runs online.
   *
   * @returns The presence service online result.
   */
  public online(): Promise<readonly UserContext[]> {
    return this.store.online();
  }
}
