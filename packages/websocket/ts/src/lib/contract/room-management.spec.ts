import { withRoomManagement } from './room-management';

describe('withRoomManagement()', () => {
  it('returns joinRoom and leaveRoom defs with default schemas', () => {
    const { joinRoom, leaveRoom } = withRoomManagement();

    expect(joinRoom.direction).toBe('c2s');
    expect(joinRoom.pattern).toBe('room.join');
    expect(leaveRoom.direction).toBe('c2s');
    expect(leaveRoom.pattern).toBe('room.leave');

    expect(joinRoom.parse({ roomId: 'r1' })).toEqual({ roomId: 'r1' });
    expect(joinRoom.parseResponse({ ok: true })).toEqual({ ok: true });
    expect(leaveRoom.parse({ roomId: 'r1' })).toEqual({ roomId: 'r1' });
    expect(leaveRoom.parseResponse({ ok: true })).toEqual({ ok: true });
  });

  it('throws on missing roomId', () => {
    const { joinRoom } = withRoomManagement();
    expect(() => joinRoom.parse({})).toThrow();
  });

  it('exports stable pattern constants for reuse by lib internals', () => {
    expect(withRoomManagement.JOIN_PATTERN).toBe('room.join');
    expect(withRoomManagement.LEAVE_PATTERN).toBe('room.leave');
  });
});
