import { Module } from '@nestjs/common';
import { ChatContract } from '@otwld/ts-chat';
import { provideTypedServer, WebsocketModule } from '@otwld/nest-websocket';
import { ChatGateway } from './chat.gateway';
import { JwtWsAuthAdapter } from './jwt-ws-auth.adapter';

/** Demo chat module mounted by the backend application. */
@Module({
  imports: [WebsocketModule.forRoot({ authAdapter: JwtWsAuthAdapter })],
  providers: [JwtWsAuthAdapter, provideTypedServer(ChatContract), ChatGateway],
})
export class ChatModule {}
