import { z } from 'zod';
import { clientEvent } from './event-builder';
import type { ClientEventDef } from './event-def';

const RoomPayloadSchema = z.object({ roomId: z.string() }) as z.ZodType<{ roomId: string }>;
const OkResponseSchema = z.object({ ok: z.literal(true) }) as z.ZodType<{ ok: true }>;

/** Default `joinRoom` event definition shape. */
export type DefaultJoinRoomDef = ClientEventDef<'room.join', { roomId: string }, { ok: true }>;

/** Default `leaveRoom` event definition shape. */
export type DefaultLeaveRoomDef = ClientEventDef<'room.leave', { roomId: string }, { ok: true }>;

/**
 * Generate `joinRoom` / `leaveRoom` event definitions for a contract.
 *
 * Consumers spread the result into their contract's `c2s` group. The default
 * `RoomManagementGateway` reads these stable patterns to provide free
 * join/leave handling.
 *
 * @param overrides Optional bespoke definitions; both default to standard schemas.
 */
function createRoomManagement(overrides?: {
  joinRoom?: DefaultJoinRoomDef;
  leaveRoom?: DefaultLeaveRoomDef;
}): { joinRoom: DefaultJoinRoomDef; leaveRoom: DefaultLeaveRoomDef } {
  return {
    joinRoom:
      overrides?.joinRoom ??
      clientEvent('room.join')
        .payload(RoomPayloadSchema)
        .response(OkResponseSchema)
        .build(),
    leaveRoom:
      overrides?.leaveRoom ??
      clientEvent('room.leave')
        .payload(RoomPayloadSchema)
        .response(OkResponseSchema)
        .build(),
  };
}

/**
 * Generate `joinRoom` / `leaveRoom` event definitions and expose stable
 * default room-management patterns.
 */
export const withRoomManagement = Object.assign(createRoomManagement, {
  /** Stable pattern for the default join event: read by lib internals. */
  JOIN_PATTERN: 'room.join',
  /** Stable pattern for the default leave event: read by lib internals. */
  LEAVE_PATTERN: 'room.leave',
});
