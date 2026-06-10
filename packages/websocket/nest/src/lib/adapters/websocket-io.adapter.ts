import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';
import type { ResolvedWebsocketModuleOptions } from '../config/websocket-module-options';
import { WS_RESOLVED_OPTIONS } from '../tokens';

/** Socket.IO adapter that applies resolved websocket module defaults. */
export class WebsocketIoAdapter extends IoAdapter {
  /**
   * Create a Socket.IO adapter for a Nest application context.
   *
   * @param appOrHttpServer - Nest application context or HTTP server accepted by `IoAdapter`.
   * @param resolved - Resolved websocket module options.
   */
  public constructor(
    appOrHttpServer: INestApplicationContext,
    private readonly resolved: ResolvedWebsocketModuleOptions,
  ) {
    super(appOrHttpServer);
  }

  /** Create a Socket.IO server with module-level CORS defaults when none are supplied. */
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

/** Create the websocket Socket.IO adapter from a Nest application context. */
export function createWebsocketIoAdapter(app: INestApplicationContext): WebsocketIoAdapter {
  return new WebsocketIoAdapter(app, app.get(WS_RESOLVED_OPTIONS, { strict: false }));
}
