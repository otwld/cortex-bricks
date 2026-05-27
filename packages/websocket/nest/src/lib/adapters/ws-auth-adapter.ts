import type { Socket } from 'socket.io';
import type {
  HandshakeContext,
  RoomId,
  UserContext,
} from '@otwld/ts-websocket';

/**
 * Authenticated socket with a non-empty user context.
 */
export interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & { context: { user: UserContext } };
}

/**
 * Pluggable handshake authenticator.
 */
export abstract class WsAuthAdapter {
  /**
   * Validate a connection at handshake.
   *
   * @param handshake Frozen view of the handshake.
   */
  /**
   * Runs authenticate.
   *
   * @param handshake - handshake value.
   *
   * @returns The ws auth adapter authenticate result.
   */
  public abstract authenticate(handshake: HandshakeContext): Promise<UserContext | null>;

  /**
   * Decide what to do when a token is about to expire mid-session.
   *
   * @param socket Authenticated socket whose token is expiring.
   */
  /**
   * Runs on token expired.
   *
   * @param socket - socket value.
   *
   * @returns The ws auth adapter on token expired result.
   */
  public onTokenExpired?(socket: AuthenticatedSocket): Promise<'disconnect' | 'allow'>;

  /**
   * Auto-join rooms based on user claims after authentication.
   *
   * @param user Authenticated user context.
   */
  /**
   * Runs resolve rooms.
   *
   * @param user - user value.
   *
   * @returns The ws auth adapter resolve rooms result.
   */
  public resolveRooms?(user: UserContext): Promise<readonly RoomId[]>;
}
