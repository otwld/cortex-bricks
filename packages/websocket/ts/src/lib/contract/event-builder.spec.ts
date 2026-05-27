import { z } from 'zod';
import { WsErrorKind } from '../enums/ws-error-kind.enum';
import { WsValidationError } from '../errors/ws-validation-error';
import { clientEvent, serverEvent } from './event-builder';

describe('clientEvent()', () => {
  describe('with payload only (fire-and-forget)', () => {
    const def = clientEvent('chat.typing').payload(z.object({ roomId: z.string() })).build();

    it('exposes direction, pattern, and payloadSchema', () => {
      expect(def.direction).toBe('c2s');
      expect(def.pattern).toBe('chat.typing');
      expect(def.responseSchema).toBeUndefined();
    });

    it('parses valid input', () => {
      expect(def.parse({ roomId: 'r1' })).toEqual({ roomId: 'r1' });
    });

    it('throws WsValidationError on invalid input', () => {
      try {
        def.parse({ roomId: 42 });
        throw new Error('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(WsValidationError);
        expect((err as WsValidationError).kind).toBe(WsErrorKind.InvalidPayload);
        expect((err as WsValidationError).pattern).toBe('chat.typing');
        expect((err as WsValidationError).issues.length).toBeGreaterThan(0);
      }
    });

    it('parseResponse returns undefined for void responses', () => {
      expect(def.parseResponse('anything')).toBeUndefined();
    });
  });

  describe('with payload and response (ack-able)', () => {
    const def = clientEvent('chat.send')
      .payload(z.object({ roomId: z.string(), text: z.string() }))
      .response(z.object({ messageId: z.string() }))
      .build();

    it('exposes responseSchema', () => {
      expect(def.responseSchema).toBeDefined();
    });

    it('parses valid response', () => {
      expect(def.parseResponse({ messageId: 'm1' })).toEqual({ messageId: 'm1' });
    });

    it('throws WsValidationError on invalid response', () => {
      try {
        def.parseResponse({ messageId: 42 });
        throw new Error('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(WsValidationError);
        expect((err as WsValidationError).kind).toBe(WsErrorKind.InvalidResponse);
      }
    });
  });
});

describe('serverEvent()', () => {
  const def = serverEvent('chat.new_message')
    .payload(z.object({ id: z.string(), text: z.string() }))
    .build();

  it('exposes direction, pattern, and payloadSchema', () => {
    expect(def.direction).toBe('s2c');
    expect(def.pattern).toBe('chat.new_message');
    expect(def.payloadSchema).toBeDefined();
  });

  it('parses valid input', () => {
    expect(def.parse({ id: 'm1', text: 'hi' })).toEqual({ id: 'm1', text: 'hi' });
  });

  it('throws WsValidationError on invalid input', () => {
    try {
      def.parse({ id: 'm1', text: 42 });
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(WsValidationError);
      expect((err as WsValidationError).kind).toBe(WsErrorKind.InvalidPayload);
      expect((err as WsValidationError).pattern).toBe('chat.new_message');
    }
  });
});
