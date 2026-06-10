/**
 * Message name format: commands.<namespace> or events.<namespace>.
 *
 * Examples:
 * - commands.user.create
 * - events.media.uploaded
 */
export const MESSAGE_TYPE_REGEX = /^(commands|events)\.[a-z0-9]+(\.[a-z0-9-]+)*$/i;
/** MessageKind. */


export type MessageKind = 'commands' | 'events';

/**
 * String alias for message types.
 * Note: TypeScript cannot enforce regex constraints at compile-time.
 */
export type MessageType = `${MessageKind}.${string}`;

/**
 * Checks whether a string matches the expected message type format.
 */
export function isMessageType(value: string): value is MessageType {
  return MESSAGE_TYPE_REGEX.test(value);
}

/**
 * Asserts that a string matches the expected message type format.
 *
 * @throws {Error} If the value is invalid.
 */
export function assertMessageType(value: string): asserts value is MessageType {
  if (!isMessageType(value)) {
    throw new Error(`Invalid message type: "${value}"`);
  }
}
