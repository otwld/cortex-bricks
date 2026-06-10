import { Injectable } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import type { Server } from 'socket.io';
import { WsScalingAdapter } from '../adapters/ws-scaling-adapter';

/** Configuration for `RedisScalingAdapter`. */
export interface RedisScalingAdapterOptions {
  /** Redis connection URL. */
  url: string;
  /** Optional key prefix for pub/sub channels. Defaults to `socket.io`. */
  keyPrefix?: string;
}

/**
 * `WsScalingAdapter` implementation backed by `@socket.io/redis-adapter`.
 */
@Injectable()
export class RedisScalingAdapter extends WsScalingAdapter {
  private pub?: ReturnType<typeof createClient>;
  private sub?: ReturnType<typeof createClient>;

  private constructor(private readonly options: RedisScalingAdapterOptions) {
    super();
  }

  /**
   * Factory used by module options.
   *
   * @param options Redis adapter options.
   */
  public static create(
    options: RedisScalingAdapterOptions,
  ): RedisScalingAdapter {
    return new RedisScalingAdapter(options);
  }

  /**
   * Attach the Redis adapter to a Socket.IO server.
   *
   * @param io Socket.IO server.
   */
  public async install(io: Server): Promise<void> {
    this.pub = createClient({ url: this.options.url });
    this.sub = this.pub.duplicate();
    await Promise.all([this.pub.connect(), this.sub.connect()]);
    io.adapter(
      createAdapter(this.pub, this.sub, {
        key: this.options.keyPrefix ?? 'socket.io',
      }),
    );
  }

  /** Disconnect Redis clients. */
  public async dispose(): Promise<void> {
    await Promise.all([this.pub?.quit(), this.sub?.quit()]);
    this.pub = undefined;
    this.sub = undefined;
  }
}
