import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';
import type { ResolvedWebsocketModuleOptions } from '../config/websocket-module-options';
import { WS_RESOLVED_OPTIONS } from '../tokens';

/**
 * Provides websocket io adapter behavior.
 */
export class WebsocketIoAdapter extends IoAdapter {
  /**
   * Creates a websocket io adapter instance.
   *
   * @param appOrHttpServer - app or http server value.
   *
   * @param resolved - resolved value.
   */
  public constructor(
    appOrHttpServer: INestApplicationContext,
    private readonly resolved: ResolvedWebsocketModuleOptions,
  ) {
    super(appOrHttpServer);
  }

  /**
   * Runs create ioserver.
   *
   * @param port - port value.
   *
   * @param options - options value.
   *
   * @returns The websocket io adapter create ioserver result.
   */
  public override createIOServer(port: number, options?: Partial<ServerOptions>): unknown {
    const merged: Partial<ServerOptions> = {
      ...(options ?? {}),
      ...(options?.cors ? {} : this.resolved.cors ? { cors: this.socketIoCors() } : {}),
    };
    return super.createIOServer(port, merged);
  }

  private socketIoCors(): NonNullable<Partial<ServerOptions>['cors']> {
    const { origin, ...rest } = this.resolved.cors ?? { origin: '*' };
    return {
      ...rest,
      origin: typeof origin === 'string' ? origin : [...origin],
    };
  }
}

/**
 * Runs create websocket io adapter.
 *
 * @param app - app value.
 *
 * @returns The create websocket io adapter result.
 */
export function createWebsocketIoAdapter(app: INestApplicationContext): WebsocketIoAdapter {
  return new WebsocketIoAdapter(app, app.get(WS_RESOLVED_OPTIONS, { strict: false }));
}
