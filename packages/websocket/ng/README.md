# @otwld/ng-websocket/core

Angular websocket client library: signal-first public API over RxJS and Socket.IO internals.

## Quickstart

```ts
provideWebsocket(ChatContract, {
  url: 'https://api.example.com',
  auth: {
    adapter: BearerTokenWsAuthAdapter.from(() => inject(AuthService).accessToken()),
  },
});
```

```ts
const client = inject(WS_CLIENT(ChatContract));
const presence = inject(WS_PRESENCE(ChatContract));

client.connected(); // Signal<boolean>
client.emitWithAck(ChatContract.c2s.send, { text: 'hi' });
client.on(ChatContract.s2c.newMessage).subscribe(console.log);
presence.members('lobby'); // Signal<UserContextSnapshot[]>
```

`provideWebsocket()` does not provide `WsClient` or `PresenceService` by class token. Use `WS_CLIENT(contract)` and `WS_PRESENCE(contract)` so applications with multiple contracts resolve the intended client and presence service.

The Socket.IO client is always created with `autoConnect: false`; when `autoConnect` is enabled in config, `WsClient` resolves auth first, assigns `socket.auth`, and then connects. `auth.adapter.onConnectError()` can return `'retry'` to refresh auth and reconnect after a failed handshake.

## Reactive State

Signals: `state`, `connected`, `transport`, `latencyMs`, `connectionError`, `reconnectAttempt`.

Streams: `errors$`, `on(event)`.

Convenience: `signal(event, initial)` wraps an event stream as a latest-value signal.

## Rooms

`client.room('lobby').join()` and `client.room('lobby').leave()` require `withRoomManagement()` in your contract.

`client.room('lobby').members()` is a signal of `UserContextSnapshot[]`.

For the `wsConnected` structural directive, pass the contract-scoped client explicitly:

```html
<ng-container *wsConnected="ConnectionState.Connected; client: client">
  ...
</ng-container>
```
