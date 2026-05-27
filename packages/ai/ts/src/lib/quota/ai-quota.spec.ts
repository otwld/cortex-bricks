import { AiErrorCode } from '../errors/ai-error';
import { aiQuotaPolicySchema, aiQuotaUsageSnapshotSchema, createAiQuotaWindowKey } from './ai-quota';

describe('AI quota contracts', () => {
  it('parses custom quota windows and policy limits', () => {
    const policy = aiQuotaPolicySchema.parse({
      enabled: true,
      storage: 'mongoose',
      defaultLimits: [{ window: { unit: 'hour', size: 5 }, maxTokens: 50_000 }],
      rules: [{ roles: ['member'], limits: [{ window: { unit: 'week', size: 1 }, maxTokens: 200_000 }], maxPromptTokens: 8_000 }],
    });

    expect(policy.rules[0].roles).toEqual(['member']);
    expect(policy.defaultLimits?.[0].window).toEqual({ unit: 'hour', size: 5 });
  });

  it('creates stable fixed-window keys', () => {
    const key = createAiQuotaWindowKey({ unit: 'hour', size: 5 }, new Date('2026-05-08T07:15:00.000Z'));

    expect(key).toBe('hour:5:2026-05-08T05:00:00.000Z');
  });

  it('parses usage snapshots for frontend display', () => {
    const snapshot = aiQuotaUsageSnapshotSchema.parse({
      subject: { type: 'user', id: 'user-1', roles: ['member'] },
      maxPromptTokens: 8_000,
      buckets: [
        {
          window: { unit: 'hour', size: 1 },
          limitTokens: 20_000,
          usedTokens: 5_000,
          reservedTokens: 1_000,
          remainingTokens: 14_000,
          resetAt: '2026-05-08T08:00:00.000Z',
          exceeded: false,
        },
      ],
    });

    expect(snapshot.buckets[0].remainingTokens).toBe(14_000);
  });

  it('exports quota-specific AI error codes', () => {
    expect(AiErrorCode.QUOTA_EXCEEDED).toBe('quota_exceeded');
    expect(AiErrorCode.PROMPT_TOKEN_LIMIT_EXCEEDED).toBe('prompt_token_limit_exceeded');
  });
});
