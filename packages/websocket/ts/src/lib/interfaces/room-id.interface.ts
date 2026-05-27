/**
 * Type alias for a Socket.IO room identifier.
 *
 * Kept as a plain string (not branded) for ergonomic interop with the
 * underlying Socket.IO API; treat it as opaque in application code.
 */
export type RoomId = string;
