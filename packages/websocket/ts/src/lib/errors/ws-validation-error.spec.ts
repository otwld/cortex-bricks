import { z } from 'zod';
import { WsErrorKind } from '../enums/ws-error-kind.enum';
import { WsError } from './ws-error';
import { WsValidationError } from './ws-validation-error';

describe('WsValidationError', () => {
  it('captures zod issues and forwards them via details', () => {
    const result = z.object({ n: z.number() }).safeParse({ n: 'oops' });
    if (result.success) throw new Error('expected validation failure');

    const err = new WsValidationError({
      kind: WsErrorKind.InvalidPayload,
      message: 'bad payload',
      pattern: 'chat.send',
      issues: result.error.issues,
    });

    expect(err).toBeInstanceOf(WsError);
    expect(err.name).toBe('WsValidationError');
    expect(err.kind).toBe(WsErrorKind.InvalidPayload);
    expect(err.issues).toBe(result.error.issues);
    expect(err.details).toEqual({ issues: result.error.issues });
  });

  it('only accepts INVALID_PAYLOAD or INVALID_RESPONSE kinds', () => {
    expect(
      () =>
        new WsValidationError({ kind: WsErrorKind.InvalidResponse, message: 'x', issues: [] }),
    ).not.toThrow();
    expect(
      () => new WsValidationError({ kind: WsErrorKind.InvalidPayload, message: 'x', issues: [] }),
    ).not.toThrow();
  });
});
