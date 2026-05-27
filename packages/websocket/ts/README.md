# @otwld/ts-websocket

Shared types, errors, and contract DSL for the websocket libraries.

## Define A Contract

```ts
import { z } from 'zod';
import {
  clientEvent,
  defineContract,
  serverEvent,
  withRoomManagement,
} from '@otwld/ts-websocket';

export const ChatContract = defineContract({
  namespace: '/chat',
  c2s: {
    ...withRoomManagement(),
    send: clientEvent('chat.send')
      .payload(z.object({ text: z.string() }))
      .response(z.object({ messageId: z.string() }))
      .build(),
  },
  s2c: {
    newMessage: serverEvent('chat.new_message')
      .payload(z.object({ id: z.string() }))
      .build(),
  },
});
```

## Errors

- `WsError`: base class for stable websocket errors.
- `WsValidationError`: payload or response failed zod validation.
- `WsAckTimeoutError`: `emitWithAck` did not receive an ack before timeout.

## Room Management

`withRoomManagement()` adds typed `room.join` and `room.leave` client events. The Nest package installs default handlers for these patterns when a typed gateway does not provide its own handler, and the Angular client exposes them through `client.room(roomId).join()` and `leave()`.
