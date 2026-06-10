import type { RoomId, UserContext } from '@otwld/ts-websocket';

/**
 * Pluggable presence backing store.
 */
export abstract class PresenceStore {
  /** Record that `user` joined `room` from `socketId`. */
  public abstract addMember(room: RoomId, socketId: string, user: UserContext): Promise<void>;

  /** Record that `socketId` left `room` and return the removed user when known. */
  public abstract removeMember(room: RoomId, socketId: string): Promise<UserContext | undefined>;

  /** Drop every record for `socketId` and return the rooms that changed. */
  public abstract removeSocket(socketId: string): Promise<readonly RoomId[]>;

  /** All distinct members currently in `room`. */
  public abstract members(room: RoomId): Promise<readonly UserContext[]>;

  /** Rooms `userId` currently has any socket in. */
  public abstract roomsOf(userId: string): Promise<readonly RoomId[]>;

  /** Online status for a single user id. */
  public abstract isOnline(userId: string): Promise<boolean>;

  /** Distinct online users across all rooms. */
  public abstract online(): Promise<readonly UserContext[]>;
}
