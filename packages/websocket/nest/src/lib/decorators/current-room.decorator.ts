import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Socket } from 'socket.io';
import type { RoomId } from '@otwld/ts-websocket';

/**
 * Inject rooms the current socket has joined, excluding its implicit own room.
 */
export const CurrentRoom = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): readonly RoomId[] => {
    const socket = ctx.switchToWs().getClient<Socket>();
    return Object.freeze(Array.from(socket.rooms).filter((room) => room !== socket.id));
  },
);
