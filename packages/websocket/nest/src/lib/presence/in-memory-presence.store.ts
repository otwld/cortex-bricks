import { Injectable } from '@nestjs/common';
import type { RoomId, UserContext } from '@otwld/ts-websocket';
import { PresenceStore } from './presence-store';

interface SocketRecord {
  user: UserContext;
  rooms: Set<RoomId>;
}

/**
 * In-memory `PresenceStore` for single-instance deployments and tests.
 */
@Injectable()
export class InMemoryPresenceStore extends PresenceStore {
  private readonly rooms = new Map<RoomId, Map<string, UserContext>>();
  private readonly sockets = new Map<string, SocketRecord>();

  /**
   * Runs add member.
   *
   * @param room - room value.
   *
   * @param socketId - socket id value.
   *
   * @param user - user value.
   */
  public async addMember(room: RoomId, socketId: string, user: UserContext): Promise<void> {
    let bucket = this.rooms.get(room);
    if (!bucket) {
      bucket = new Map();
      this.rooms.set(room, bucket);
    }
    bucket.set(socketId, user);

    let record = this.sockets.get(socketId);
    if (!record) {
      record = { user, rooms: new Set() };
      this.sockets.set(socketId, record);
    }
    record.rooms.add(room);
  }

  /**
   * Runs remove member.
   *
   * @param room - room value.
   *
   * @param socketId - socket id value.
   *
   * @returns The in memory presence store remove member result.
   */
  public async removeMember(room: RoomId, socketId: string): Promise<UserContext | undefined> {
    const bucket = this.rooms.get(room);
    const user = bucket?.get(socketId);
    if (bucket) {
      bucket.delete(socketId);
      if (bucket.size === 0) this.rooms.delete(room);
    }

    const record = this.sockets.get(socketId);
    record?.rooms.delete(room);
    if (record?.rooms.size === 0) this.sockets.delete(socketId);
    return user;
  }

  /**
   * Runs remove socket.
   *
   * @param socketId - socket id value.
   *
   * @returns The in memory presence store remove socket result.
   */
  public async removeSocket(socketId: string): Promise<readonly RoomId[]> {
    const record = this.sockets.get(socketId);
    if (!record) return [];
    const rooms = [...record.rooms];
    for (const room of rooms) {
      const bucket = this.rooms.get(room);
      bucket?.delete(socketId);
      if (bucket?.size === 0) this.rooms.delete(room);
    }
    this.sockets.delete(socketId);
    return rooms;
  }

  /**
   * Runs members.
   *
   * @param room - room value.
   *
   * @returns The in memory presence store members result.
   */
  public async members(room: RoomId): Promise<readonly UserContext[]> {
    const bucket = this.rooms.get(room);
    if (!bucket) return [];
    const seen = new Map<string, UserContext>();
    for (const user of bucket.values()) {
      if (!seen.has(user.id)) seen.set(user.id, user);
    }
    return [...seen.values()];
  }

  /**
   * Runs rooms of.
   *
   * @param userId - user id value.
   *
   * @returns The in memory presence store rooms of result.
   */
  public async roomsOf(userId: string): Promise<readonly RoomId[]> {
    const result = new Set<RoomId>();
    for (const record of this.sockets.values()) {
      if (record.user.id === userId) {
        for (const room of record.rooms) result.add(room);
      }
    }
    return [...result];
  }

  /**
   * Runs is online.
   *
   * @param userId - user id value.
   *
   * @returns The in memory presence store is online result.
   */
  public async isOnline(userId: string): Promise<boolean> {
    for (const record of this.sockets.values()) {
      if (record.user.id === userId) return true;
    }
    return false;
  }

  /**
   * Runs online.
   *
   * @returns The in memory presence store online result.
   */
  public async online(): Promise<readonly UserContext[]> {
    const seen = new Map<string, UserContext>();
    for (const record of this.sockets.values()) {
      if (!seen.has(record.user.id)) seen.set(record.user.id, record.user);
    }
    return [...seen.values()];
  }
}
