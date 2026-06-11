import { Injectable } from '@nestjs/common';
import { WsAuthAdapter } from '@otwld/nest-websocket';
import type { HandshakeContext, UserContext } from '@otwld/ts-websocket';

/** Demo websocket auth adapter that accepts any non-empty bearer token. */
@Injectable()
export class JwtWsAuthAdapter extends WsAuthAdapter {
  /**
   * Convert the demo handshake token into a websocket user context.
   *
   * @param handshake Socket.IO handshake context.
   * @returns AuthAccount context when the token is non-empty; otherwise null.
   */
  public async authenticate(handshake: HandshakeContext): Promise<UserContext | null> {
    const token = String(handshake.auth['token'] ?? '');
    if (!token) return null;
    return { id: token, claims: {}, authenticatedAt: new Date() };
  }
}
