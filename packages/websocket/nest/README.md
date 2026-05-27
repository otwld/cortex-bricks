# @otwld/nest-websocket

NestJS WebSocket library with end-to-end zod-typed Socket.IO contracts.

## Quickstart

```ts
@TypedGateway(ChatContract, { cors: 'inherit' })
export class ChatGateway {
  constructor(
    @Inject(TYPED_SERVER(ChatContract))
    private readonly server: TypedServer<typeof ChatContract>,
  ) {}

  @OnEvent(ChatContract.c2s.send)
  async onSend(
    @WsPayload() payload: { roomId: string; text: string },
    @CurrentSocketUser() user: UserContext,
  ): Promise<{ messageId: string }> {
    await this.server.to(payload.roomId).emit(ChatContract.s2c.newMessage, {
      id: 'message-id',
      roomId: payload.roomId,
      authorId: user.id,
      text: payload.text,
      sentAt: Date.now(),
    });
    return { messageId: 'message-id' };
  }
}
```

In `main.ts`, use the module-aware Socket.IO adapter when the application imports `WebsocketModule`:

```ts
const app = await NestFactory.create(AppModule);
app.useWebSocketAdapter(createWebsocketIoAdapter(app));
await app.listen(3000);
```

## Module Registration

```ts
@Module({
  imports: [
    WebsocketModule.forRoot({
      cors: { origin: ['https://app.example.com'], credentials: true },
      authAdapter: JwtWsAuthAdapter,
    }),
  ],
  providers: [JwtWsAuthAdapter, provideTypedServer(ChatContract), ChatGateway],
})
export class ChatModule {}
```

`WebsocketModule.forRootAsync()` registers the same lifecycle, auth, presence, scaling, and typed-server registry providers as `forRoot()`.

## Auth Adapter

Subclass `WsAuthAdapter` and implement `authenticate(handshake)`. The library never imports `@otwld/nest-auth`; wire your app-specific auth inside the adapter.

Authentication runs in Socket.IO namespace middleware before event handlers can process messages. If a gateway requires auth and the adapter returns `undefined`, the handshake is rejected.

## Rooms And Presence

Add `withRoomManagement()` to a contract to enable default `room.join` and `room.leave` handlers. The lifecycle records presence on join/leave and emits `presence:update` by default. If any gateway in a namespace defines a custom handler for one of those patterns, the default handler for that pattern is not installed.

## Scaling

Default behavior is single-instance. For multi-node deployments, use the Redis scaling exports from `@otwld/nest-websocket`; scaling adapters are installed once during gateway initialization and disposed during Nest shutdown.

## Demo Safety

The demo chat gateway is for smoke tests and local development only. Mount it only when `WS_DEMO_ONLY=true`; production application modules should not import the demo chat module or route-scoped demo websocket provider.
