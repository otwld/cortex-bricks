import type { Mocked } from 'vitest';
import {
  AiRequestLimits,
  DEFAULT_AI_REQUEST_LIMITS,
} from '@otwld/ts-ai';
import { NormalizedAiEndpointOptions } from '../config/ai-module-options';
import { AiException } from '../exceptions/ai.exception';
import { AiQuotaStorage } from './ai-quota-storage';
import { AiQuotaService } from './ai-quota.service';

describe(AiQuotaService.name, () => {
  const limits: AiRequestLimits = DEFAULT_AI_REQUEST_LIMITS;
  let storage: Mocked<AiQuotaStorage>;

  beforeEach(() => {
    storage = {
      getUsage: vi.fn().mockResolvedValue([]),
      reserve: vi.fn().mockResolvedValue({
        id: 'reservation-1',
        subject: { type: 'user', id: 'user-1', roles: ['member'] },
        requestedTokens: 10,
        entries: [],
      }),
      commit: vi.fn().mockResolvedValue(undefined),
      release: vi.fn().mockResolvedValue(undefined),
    };
  });

  function service(
    endpoints: Partial<NormalizedAiEndpointOptions>,
  ): AiQuotaService {
    return new AiQuotaService(
      {
        controller: true,
        prefix: 'ai',
        guards: [],
        limits,
        quota: { enabled: false, rules: [] },
        ...endpoints,
      },
      storage,
    );
  }

  it('returns null reservations when quota is disabled', async () => {
    await expect(
      service({ quota: { enabled: false, rules: [] } }).reserveForRequest(
        { user: { id: 'user-1' } },
        'completion',
        { prompt: 'Hello' },
      ),
    ).resolves.toBeNull();
    expect(storage.reserve).not.toHaveBeenCalled();
  });

  it('resolves the most permissive matching role limits', async () => {
    await service({
      quota: {
        enabled: true,
        storage: 'mongoose',
        defaultLimits: [
          { window: { unit: 'hour', size: 1 }, maxTokens: 1_000 },
        ],
        rules: [
          {
            roles: ['member'],
            limits: [{ window: { unit: 'hour', size: 1 }, maxTokens: 2_000 }],
            maxPromptTokens: 500,
          },
          {
            roles: ['admin'],
            limits: [{ window: { unit: 'hour', size: 1 }, maxTokens: 10_000 }],
            maxPromptTokens: 2_000,
          },
        ],
      },
    }).reserveForRequest(
      {
        user: { id: 'user-1', roles: [{ name: 'member' }, { name: 'admin' }] },
      },
      'completion',
      {
        prompt: 'Hello',
        maxOutputTokens: 100,
      },
    );

    expect(storage.reserve).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: { type: 'user', id: 'user-1', roles: ['member', 'admin'] },
        limits: [{ window: { unit: 'hour', size: 1 }, maxTokens: 10_000 }],
      }),
    );
  });

  it('rejects prompts above the effective prompt token limit', async () => {
    await expect(
      service({
        quota: {
          enabled: true,
          storage: 'mongoose',
          defaultLimits: [
            { window: { unit: 'hour', size: 1 }, maxTokens: 20_000 },
          ],
          rules: [],
          maxPromptTokens: 1,
        },
      }).reserveForRequest({ user: { id: 'user-1' } }, 'completion', {
        prompt: 'This prompt is longer than one token',
      }),
    ).rejects.toBeInstanceOf(AiException);

    expect(storage.reserve).not.toHaveBeenCalled();
  });

  it('returns a usage snapshot for the current user', async () => {
    storage.getUsage.mockResolvedValueOnce([
      {
        window: { unit: 'hour', size: 1 },
        limitTokens: 20_000,
        usedTokens: 1_000,
        reservedTokens: 0,
        remainingTokens: 19_000,
        resetAt: '2026-05-08T08:00:00.000Z',
        exceeded: false,
      },
    ]);

    const snapshot = await service({
      quota: {
        enabled: true,
        storage: 'mongoose',
        defaultLimits: [
          { window: { unit: 'hour', size: 1 }, maxTokens: 20_000 },
        ],
        rules: [],
        maxPromptTokens: 8_000,
      },
    }).snapshotForRequest({ user: { id: 'user-1', roles: ['member'] } });

    expect(snapshot).toEqual(
      expect.objectContaining({
        subject: { type: 'user', id: 'user-1', roles: ['member'] },
        maxPromptTokens: 8_000,
      }),
    );
    expect(snapshot.buckets[0].remainingTokens).toBe(19_000);
  });
});
