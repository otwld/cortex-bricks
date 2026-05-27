import { expectAssignable, expectError, expectType } from 'tsd';
import { z } from 'zod';
import { defineContract } from './define-contract';
import { clientEvent, serverEvent } from './event-builder';
import type {
  C2sAckKeys,
  C2sKeys,
  InferClientToServer,
  InferServerToClient,
  S2cKeys,
} from './infer-socket-types';

const ChatContract = defineContract({
  namespace: '/chat',
  c2s: {
    send: clientEvent('chat.send')
      .payload(z.object({ text: z.string() }))
      .response(z.object({ id: z.string() }))
      .build(),
    typing: clientEvent('chat.typing').payload(z.object({ roomId: z.string() })).build(),
  },
  s2c: {
    newMessage: serverEvent('chat.new_message').payload(z.object({ id: z.string() })).build(),
  },
});

type ChatContractT = typeof ChatContract;

type C2S = InferClientToServer<ChatContractT>;
expectType<(payload: { text: string }, ack: (response: { id: string }) => void) => void>(
  null as unknown as C2S['chat.send'],
);
expectType<(payload: { roomId: string }) => void>(null as unknown as C2S['chat.typing']);

type S2C = InferServerToClient<ChatContractT>;
expectType<(payload: { id: string }) => void>(null as unknown as S2C['chat.new_message']);

expectAssignable<'send'>(null as unknown as C2sAckKeys<ChatContractT>);
expectError<'typing'>(null as unknown as C2sAckKeys<ChatContractT>);

expectAssignable<'send' | 'typing'>(null as unknown as C2sKeys<ChatContractT>);
expectAssignable<'newMessage'>(null as unknown as S2cKeys<ChatContractT>);
