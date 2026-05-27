import { WsErrorKind } from '../enums/ws-error-kind.enum';
import { WsError } from './ws-error';
import { WsAckTimeoutError } from './ws-ack-timeout-error';

describe('WsAckTimeoutError', () => {
  it('captures timeoutMs and pattern with AckTimeout kind', () => {
    const err = new WsAckTimeoutError({ pattern: 'chat.send', timeoutMs: 10_000 });

    expect(err).toBeInstanceOf(WsError);
    expect(err.name).toBe('WsAckTimeoutError');
    expect(err.kind).toBe(WsErrorKind.AckTimeout);
    expect(err.pattern).toBe('chat.send');
    expect(err.timeoutMs).toBe(10_000);
    expect(err.message).toContain('chat.send');
    expect(err.message).toContain('10000');
  });
});
