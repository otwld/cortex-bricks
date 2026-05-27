import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Socket } from 'socket.io';
import type { UserContext } from '@otwld/ts-websocket';
import { getConnectionContext } from '../gateway/connection-context';

/**
 * Inject the authenticated `UserContext` for the current socket.
 */
export const CurrentSocketUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UserContext | undefined => {
    const socket = ctx.switchToWs().getClient<Socket>();
    return getConnectionContext(socket).user;
  },
);
