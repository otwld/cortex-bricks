import { Inject, Injectable } from '@nestjs/common';
import { ChatContract } from '@otwld/ts-chat';
import {
  CurrentSocketUser,
  OnEvent,
  TYPED_SERVER,
  TypedGateway,
  type TypedServer,
  WsPayload,
} from '@otwld/nest-websocket';
import type { UserContext } from '@otwld/ts-websocket';
import { randomUUID } from 'node:crypto';

/** Demo chat gateway used by the websocket E2E smoke test. */
@TypedGateway(ChatContract, { cors: { origin: '*', credentials: false } })
@Injectable()
export class ChatGateway {
  public constructor(
    @Inject(TYPED_SERVER(ChatContract))
    private readonly server: TypedServer<typeof ChatContract>,
  ) {}

  /**
   * Persist-free demo send handler that broadcasts to the requested room.
   *
   * @param payload Message payload.
   * @param user Authenticated websocket user.
   * @returns Ack payload containing message id and server timestamp.
   */
  @OnEvent(ChatContract.c2s.send)
  public async onSend(
    @WsPayload() payload: { roomId: string; text: string },
    @CurrentSocketUser() user: UserContext | undefined,
  ): Promise<{ messageId: string; serverTimestamp: number }> {
    const message = {
      id: randomUUID(),
      roomId: payload.roomId,
      authorId: user?.id ?? 'demo-user',
      text: payload.text,
      sentAt: Date.now(),
    };

    await this.server.to(payload.roomId).emit(ChatContract.s2c.newMessage, message);
    return { messageId: message.id, serverTimestamp: message.sentAt };
  }

  /**
   * No-op typing signal used to exercise fire-and-forget events.
   *
   * @returns Promise that resolves once the typing event has been accepted.
   */
  @OnEvent(ChatContract.c2s.typing)
  public async onTyping(): Promise<void> {
    return undefined;
  }
}
