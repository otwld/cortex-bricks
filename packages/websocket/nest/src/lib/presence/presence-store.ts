import type { RoomId, UserContext } from '@otwld/ts-websocket';

/**
 * Pluggable presence backing store.
 */
export abstract class PresenceStore {
  /** Record that `user` joined `room` from `socketId`. */
  /**
   * Runs add member.
   *
   * @param room - room value.
   *
   * @param socketId - socket id value.
   *
   * @param user - user value.
   */
  public abstract addMember(room: RoomId, socketId: string, user: UserContext): Promise<void>;

  /** Record that `socketId` left `room`. */
  /**
   * Runs remove member.
   *
   * @param room - room value.
   *
   * @param socketId - socket id value.
   *
   * @returns The presence store remove member result.
   */
  public abstract removeMember(room: RoomId, socketId: string): Promise<UserContext | undefined>;

  /** Drop every record for `socketId`. */
  /**
   * Runs remove socket.
   *
   * @param socketId - socket id value.
   *
   * @returns The presence store remove socket result.
   */
  public abstract removeSocket(socketId: string): Promise<readonly RoomId[]>;

  /** All distinct members currently in `room`. */
  /**
   * Runs members.
   *
   * @param room - room value.
   *
   * @returns The presence store members result.
   */
  public abstract members(room: RoomId): Promise<readonly UserContext[]>;

  /** Rooms `userId` currently has any socket in. */
  /**
   * Runs rooms of.
   *
   * @param userId - user id value.
   *
   * @returns The presence store rooms of result.
   */
  public abstract roomsOf(userId: string): Promise<readonly RoomId[]>;

  /** Online status for a single user id. */
  /**
   * Runs is online.
   *
   * @param userId - user id value.
   *
   * @returns The presence store is online result.
   */
  public abstract isOnline(userId: string): Promise<boolean>;

  /** Distinct online users across all rooms. */
  /**
   * Runs online.
   *
   * @returns The presence store online result.
   */
  public abstract online(): Promise<readonly UserContext[]>;
}
