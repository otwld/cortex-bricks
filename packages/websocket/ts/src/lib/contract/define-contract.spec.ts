import { z } from 'zod';
import { defineContract } from './define-contract';
import { clientEvent, serverEvent } from './event-builder';

describe('defineContract()', () => {
  const ChatContract = defineContract({
    namespace: '/chat',
    c2s: {
      send: clientEvent('chat.send')
        .payload(z.object({ text: z.string() }))
        .response(z.object({ id: z.string() }))
        .build(),
      typing: clientEvent('chat.typing').payload(z.object({})).build(),
    },
    s2c: {
      newMessage: serverEvent('chat.new_message').payload(z.object({ id: z.string() })).build(),
    },
  });

  it('preserves namespace', () => {
    expect(ChatContract.namespace).toBe('/chat');
  });

  it('exposes c2s and s2c groups', () => {
    expect(ChatContract.c2s.send.pattern).toBe('chat.send');
    expect(ChatContract.c2s.typing.pattern).toBe('chat.typing');
    expect(ChatContract.s2c.newMessage.pattern).toBe('chat.new_message');
  });

  it('keeps direction discriminators intact', () => {
    expect(ChatContract.c2s.send.direction).toBe('c2s');
    expect(ChatContract.s2c.newMessage.direction).toBe('s2c');
  });

  it('default namespace is "/" when omitted', () => {
    const Bare = defineContract({
      c2s: {},
      s2c: {},
    });
    expect(Bare.namespace).toBe('/');
  });

  it('rejects duplicate patterns across c2s and s2c', () => {
    expect(() =>
      defineContract({
        c2s: { x: clientEvent('dup.pat').payload(z.object({})).build() },
        s2c: { y: serverEvent('dup.pat').payload(z.object({})).build() },
      }),
    ).toThrow(/duplicate pattern.*dup\.pat/i);
  });
});
