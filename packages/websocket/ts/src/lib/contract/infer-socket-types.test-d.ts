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

expectType<string>(ChatContract.namespace);

type ChatContractT = typeof ChatContract;

type C2S = InferClientToServer<ChatContractT>;
declare const sendHandler: C2S['chat.send'];
declare const typingHandler: C2S['chat.typing'];
expectType<(payload: { text: string }, ack: (response: { id: string }) => void) => void>(
  sendHandler,
);
expectType<(payload: { roomId: string }) => void>(typingHandler);

type S2C = InferServerToClient<ChatContractT>;
declare const newMessageHandler: S2C['chat.new_message'];
expectType<(payload: { id: string }) => void>(newMessageHandler);

declare const c2sAckKey: C2sAckKeys<ChatContractT>;
declare const c2sKey: C2sKeys<ChatContractT>;
declare const s2cKey: S2cKeys<ChatContractT>;

expectAssignable<'send'>(c2sAckKey);
expectError(expectAssignable<'typing'>(c2sAckKey));

expectAssignable<'send' | 'typing'>(c2sKey);
expectAssignable<'newMessage'>(s2cKey);
