/**
 * Direction tag attached to every event definition.
 *
 * Used to discriminate ClientEventDef from ServerEventDef at runtime and in
 * conditional types.
 */
export type EventDirection = 'c2s' | 's2c';
