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

type RedisPresenceClient = ReturnType<typeof createPresenceClient>;

/**
 * Redis-backed `PresenceStore` for multi-node deployments.
 */
@Injectable()
export class RedisPresenceStore extends PresenceStore {
  private readonly prefix: string;

  private constructor(
    private readonly client: RedisPresenceClient,
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
  public static async create(options: RedisPresenceStoreOptions): Promise<RedisPresenceStore> {
    const client = createPresenceClient(options.url);
    await client.connect();
    return new RedisPresenceStore(client, options);
  }

  /** Disconnect from Redis. */
  public async dispose(): Promise<void> {
    await this.client.quit();
  }

  /** Test helper: delete all presence keys under the prefix. */
  public async flushAll(): Promise<void> {
    const keys = await this.keysStrings(`${this.prefix}*`);
    if (keys.length > 0) await this.client.del(keys);
  }

  /** Store room, socket, and user lookup records for one connected socket. */
  public async addMember(room: RoomId, socketId: string, user: UserContext): Promise<void> {
    const serialized = JSON.stringify(serialize(user));
    const tx = this.client.multi();
    tx.hSet(this.roomKey(room), socketId, serialized);
    tx.hSet(this.socketKey(socketId), 'user', serialized);
    tx.sAdd(this.socketRoomsKey(socketId), room);
    tx.sAdd(this.userKey(user.id), socketId);
    await tx.exec();
  }

  /** Remove one socket from a room and clean up reverse indexes when unused. */
  public async removeMember(room: RoomId, socketId: string): Promise<UserContext | undefined> {
    const userJson = await this.hGetString(this.roomKey(room), socketId);
    const tx = this.client.multi();
    tx.hDel(this.roomKey(room), socketId);
    tx.sRem(this.socketRoomsKey(socketId), room);
    await tx.exec();
    if (!userJson) return undefined;

    const user = deserialize(JSON.parse(userJson) as SerializedUser);
    if ((await this.sCardNumber(this.socketRoomsKey(socketId))) === 0) {
      const cleanup = this.client.multi();
      cleanup.del(this.socketKey(socketId));
      cleanup.del(this.socketRoomsKey(socketId));
      cleanup.sRem(this.userKey(user.id), socketId);
      await cleanup.exec();
    }
    return user;
  }

  /** Remove all Redis presence records for a disconnected socket. */
  public async removeSocket(socketId: string): Promise<readonly RoomId[]> {
    const rooms = await this.sMembersStrings(this.socketRoomsKey(socketId));
    const userJson = await this.hGetString(this.socketKey(socketId), 'user');
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

  /** List distinct users that currently have at least one socket in `room`. */
  public async members(room: RoomId): Promise<readonly UserContext[]> {
    const map = await this.client.hGetAll(this.roomKey(room));
    const seen = new Map<string, UserContext>();
    for (const json of Object.values(map)) {
      const user = deserialize(JSON.parse(json) as SerializedUser);
      if (!seen.has(user.id)) seen.set(user.id, user);
    }
    return [...seen.values()];
  }

  /** List rooms where any socket for `userId` is currently present. */
  public async roomsOf(userId: string): Promise<readonly RoomId[]> {
    const sockets = await this.sMembersStrings(this.userKey(userId));
    const all = new Set<RoomId>();
    for (const socketId of sockets) {
      const rooms = await this.sMembersStrings(this.socketRoomsKey(socketId));
      for (const room of rooms) all.add(room);
    }
    return [...all];
  }

  /** Return whether `userId` has at least one tracked socket. */
  public async isOnline(userId: string): Promise<boolean> {
    return (await this.sCardNumber(this.userKey(userId))) > 0;
  }

  /** List distinct users with at least one active socket across all rooms. */
  public async online(): Promise<readonly UserContext[]> {
    const userKeys = await this.keysStrings(`${this.prefix}user:*`);
    const seen = new Map<string, UserContext>();
    for (const key of userKeys) {
      const sockets = await this.client.sMembers(key);
      const firstSocket = sockets[0];
      if (!firstSocket) continue;
      const userJson = await this.hGetString(this.socketKey(firstSocket), 'user');
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

  private async hGetString(key: string, field: string): Promise<string | undefined> {
    const value = await this.client.hGet(key, field);
    return value == null ? undefined : toRedisString(value);
  }

  private async keysStrings(pattern: string): Promise<string[]> {
    const keys = await this.client.keys(pattern);
    return keys.map(toRedisString);
  }

  private async sMembersStrings(key: string): Promise<string[]> {
    const members = await this.client.sMembers(key);
    return [...members].map(toRedisString);
  }

  private async sCardNumber(key: string): Promise<number> {
    return Number(await this.client.sCard(key));
  }
}

function createPresenceClient(url: string) {
  return createClient({ url });
}

function toRedisString(value: string | Buffer): string {
  return typeof value === 'string' ? value : value.toString();
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
