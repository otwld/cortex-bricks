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
  public abstract authenticate(handshake: HandshakeContext): Promise<UserContext | null>;

  /**
   * Decide what to do when a token is about to expire mid-session.
   *
   * @param socket Authenticated socket whose token is expiring.
   */
  public onTokenExpired?(socket: AuthenticatedSocket): Promise<'disconnect' | 'allow'>;

  /**
   * Auto-join rooms based on user claims after authentication.
   *
   * @param user Authenticated user context.
   */
  public resolveRooms?(user: UserContext): Promise<readonly RoomId[]>;
}
