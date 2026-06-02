import { clientEvent, defineContract, serverEvent, withRoomManagement } from '@otwld/ts-websocket';
import { z } from 'zod';

const MessageSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  authorId: z.string(),
  text: z.string(),
  sentAt: z.number(),
});

/** Demo chat contract used by the websocket smoke tests. */
export const ChatContract = defineContract({
  namespace: '/chat',
  c2s: {
    ...withRoomManagement(),
    send: clientEvent('chat.send')
      .payload(z.object({ roomId: z.string(), text: z.string().min(1).max(2_000) }))
      .response(z.object({ messageId: z.string(), serverTimestamp: z.number() }))
      .build(),
    typing: clientEvent('chat.typing').payload(z.object({ roomId: z.string() })).build(),
  },
  s2c: {
    newMessage: serverEvent('chat.new_message').payload(MessageSchema).build(),
  },
} as const);

/** Runtime type of the demo chat contract. */
export type ChatContract = typeof ChatContract;
/** Message shape broadcast by the demo gateway. */
export type ChatMessage = z.infer<typeof MessageSchema>;
