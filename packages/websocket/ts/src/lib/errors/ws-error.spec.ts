import { WsErrorKind } from '../enums/ws-error-kind.enum';
import { WsError } from './ws-error';

describe('WsError', () => {
  it('preserves kind, pattern, and details', () => {
    const err = new WsError({
      kind: WsErrorKind.Transport,
      message: 'boom',
      pattern: 'chat.send',
      details: { code: 'ECONNRESET' },
    });

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(WsError);
    expect(err.name).toBe('WsError');
    expect(err.message).toBe('boom');
    expect(err.kind).toBe(WsErrorKind.Transport);
    expect(err.pattern).toBe('chat.send');
    expect(err.details).toEqual({ code: 'ECONNRESET' });
  });

  it('omits pattern and details when not provided', () => {
    const err = new WsError({ kind: WsErrorKind.Unauthorized, message: 'no token' });
    expect(err.pattern).toBeUndefined();
    expect(err.details).toBeUndefined();
  });
});
