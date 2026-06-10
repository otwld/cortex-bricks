import { assertMessageType, isMessageType } from './message-type';
import { groupByDateKey } from './group-by-date-key.util';

describe('message-type', () => {
  it('accepts valid message types', () => {
    expect(isMessageType('commands.user.create')).toBe(true);
    expect(isMessageType('events.media.uploaded')).toBe(true);
  });

  it('rejects invalid message types', () => {
    expect(isMessageType('command.user.create')).toBe(false);
    expect(isMessageType('events')).toBe(false);
  });

  it('asserts message types', () => {
    expect(() => assertMessageType('events.media.uploaded')).not.toThrow();
    expect(() => assertMessageType('invalid')).toThrow();
  });
});

describe(groupByDateKey.name, () => {
  const originalTimezone = process.env['TZ'];

  afterEach(() => {
    if (originalTimezone === undefined) {
      delete process.env['TZ'];
    } else {
      process.env['TZ'] = originalTimezone;
    }
  });

  it('keeps local-day keys when grouping in a positive-offset timezone', () => {
    process.env['TZ'] = 'Asia/Makassar';

    const [bucket] = groupByDateKey([{ createdAt: new Date(2026, 0, 2, 12) }], 'createdAt', {
      tz: 'local',
    });

    expect(bucket.key).toBe('2026-01-02');
  });
});
