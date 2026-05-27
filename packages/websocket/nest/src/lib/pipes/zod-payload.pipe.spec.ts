import { clientEvent } from '@otwld/ts-websocket';
import { z } from 'zod';
import { WsValidationException } from '../exceptions/ws-validation.exception';
import { ZodPayloadPipe } from './zod-payload.pipe';

describe('ZodPayloadPipe', () => {
  const def = clientEvent('chat.send').payload(z.object({ text: z.string() })).build();

  it('returns the parsed value on valid input', () => {
    const pipe = new ZodPayloadPipe(def);
    expect(pipe.transform({ text: 'hi' })).toEqual({ text: 'hi' });
  });

  it('throws WsValidationException on invalid input', () => {
    const pipe = new ZodPayloadPipe(def);
    expect(() => pipe.transform({ text: 42 })).toThrow(WsValidationException);
  });

  it('strips unknown extras when zod schema does not error on them', () => {
    const pipe = new ZodPayloadPipe(def);
    expect(pipe.transform({ text: 'hi', extra: true })).toEqual({ text: 'hi' });
  });
});
