import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';
import type { RoomId, UserContext } from '@otwld/ts-websocket';
import { PresenceStore } from '../presence/presence-store';

/** Configuration for `RedisPresenceStore`. */
export interface RedisPresenceStoreOptions {
  /** Redis URL. */
  url: string;
  /** Key prefix for all presence keys. Defaults to `ws:presence:`. */
  keyPrefix?: string;
}

interface SerializedUser {
  id: string;
  claims: Record<string, unknown>;
  authenticatedAt: number;
}

/**
 * Redis-backed `PresenceStore` for multi-node deployments.
 */
@Injectable()
export class RedisPresenceStore extends PresenceStore {
  private readonly prefix: string;

  private constructor(
    private readonly client: ReturnType<typeof createClient>,
    options: RedisPresenceStoreOptions,
  ) {
    super();
    this.prefix = options.keyPrefix ?? 'ws:presence:';
  }

  /**
   * Connect to Redis and return a ready store.
   *
   * @param options Redis store options.
   */
  /**
   * Runs create.
   *
   * @param options - options value.
   *
   * @returns The redis presence store create result.
   */
  public static async create(options: RedisPresenceStoreOptions): Promise<RedisPresenceStore> {
    const client = createClient({ url: options.url });
    await client.connect();
    return new RedisPresenceStore(client, options);
  }

  /** Disconnect from Redis. */
  public async dispose(): Promise<void> {
    await this.client.quit();
  }

  /** Test helper: delete all presence keys under the prefix. */
  public async flushAll(): Promise<void> {
    const keys = await this.client.keys(`${this.prefix}*`);
    if (keys.length > 0) await this.client.del(keys);
  }

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
    const serialized = JSON.stringify(serialize(user));
    const tx = this.client.multi();
    tx.hSet(this.roomKey(room), socketId, serialized);
    tx.hSet(this.socketKey(socketId), 'user', serialized);
    tx.sAdd(this.socketRoomsKey(socketId), room);
    tx.sAdd(this.userKey(user.id), socketId);
    await tx.exec();
  }

  /**
   * Runs remove member.
   *
   * @param room - room value.
   *
   * @param socketId - socket id value.
   *
   * @returns The redis presence store remove member result.
   */
  public async removeMember(room: RoomId, socketId: string): Promise<UserContext | undefined> {
    const userJson = await this.client.hGet(this.roomKey(room), socketId);
    const tx = this.client.multi();
    tx.hDel(this.roomKey(room), socketId);
    tx.sRem(this.socketRoomsKey(socketId), room);
    await tx.exec();
    if (!userJson) return undefined;

    const user = deserialize(JSON.parse(userJson) as SerializedUser);
    if ((await this.client.sCard(this.socketRoomsKey(socketId))) === 0) {
      const cleanup = this.client.multi();
      cleanup.del(this.socketKey(socketId));
      cleanup.del(this.socketRoomsKey(socketId));
      cleanup.sRem(this.userKey(user.id), socketId);
      await cleanup.exec();
    }
    return user;
  }

  /**
   * Runs remove socket.
   *
   * @param socketId - socket id value.
   *
   * @returns The redis presence store remove socket result.
   */
  public async removeSocket(socketId: string): Promise<readonly RoomId[]> {
    const rooms = await this.client.sMembers(this.socketRoomsKey(socketId));
    const userJson = await this.client.hGet(this.socketKey(socketId), 'user');
    const tx = this.client.multi();
    for (const room of rooms) tx.hDel(this.roomKey(room), socketId);
    tx.del(this.socketKey(socketId));
    tx.del(this.socketRoomsKey(socketId));
    if (userJson) {
      const user = JSON.parse(userJson) as SerializedUser;
      tx.sRem(this.userKey(user.id), socketId);
    }
    await tx.exec();
    return rooms;
  }

  /**
   * Runs members.
   *
   * @param room - room value.
   *
   * @returns The redis presence store members result.
   */
  public async members(room: RoomId): Promise<readonly UserContext[]> {
    const map = await this.client.hGetAll(this.roomKey(room));
    const seen = new Map<string, UserContext>();
    for (const json of Object.values(map)) {
      const user = deserialize(JSON.parse(json) as SerializedUser);
      if (!seen.has(user.id)) seen.set(user.id, user);
    }
    return [...seen.values()];
  }

  /**
   * Runs rooms of.
   *
   * @param userId - user id value.
   *
   * @returns The redis presence store rooms of result.
   */
  public async roomsOf(userId: string): Promise<readonly RoomId[]> {
    const sockets = await this.client.sMembers(this.userKey(userId));
    const all = new Set<RoomId>();
    for (const socketId of sockets) {
      const rooms = await this.client.sMembers(this.socketRoomsKey(socketId));
      for (const room of rooms) all.add(room);
    }
    return [...all];
  }

  /**
   * Runs is online.
   *
   * @param userId - user id value.
   *
   * @returns The redis presence store is online result.
   */
  public async isOnline(userId: string): Promise<boolean> {
    return (await this.client.sCard(this.userKey(userId))) > 0;
  }

  /**
   * Runs online.
   *
   * @returns The redis presence store online result.
   */
  public async online(): Promise<readonly UserContext[]> {
    const userKeys = await this.client.keys(`${this.prefix}user:*`);
    const seen = new Map<string, UserContext>();
    for (const key of userKeys) {
      const sockets = await this.client.sMembers(key);
      const firstSocket = sockets[0];
      if (!firstSocket) continue;
      const userJson = await this.client.hGet(this.socketKey(firstSocket), 'user');
      if (!userJson) continue;
      const user = deserialize(JSON.parse(userJson) as SerializedUser);
      seen.set(user.id, user);
    }
    return [...seen.values()];
  }

  private roomKey(room: RoomId): string {
    return `${this.prefix}room:${room}`;
  }

  private socketKey(socketId: string): string {
    return `${this.prefix}socket:${socketId}:meta`;
  }

  private socketRoomsKey(socketId: string): string {
    return `${this.prefix}socket:${socketId}:rooms`;
  }

  private userKey(userId: string): string {
    return `${this.prefix}user:${userId}`;
  }
}

function serialize(user: UserContext): SerializedUser {
  return {
    id: user.id,
    claims: user.claims as Record<string, unknown>,
    authenticatedAt: user.authenticatedAt.getTime(),
  };
}

function deserialize(serialized: SerializedUser): UserContext {
  return {
    id: serialized.id,
    claims: serialized.claims,
    authenticatedAt: new Date(serialized.authenticatedAt),
  };
}
