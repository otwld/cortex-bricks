import { AiException } from '../exceptions/ai.exception';
import { validateAiModuleOptions } from './ai-module-options';

describe('validateAiModuleOptions', () => {
  it('normalizes endpoint defaults', () => {
    const options = validateAiModuleOptions({
      providers: { openai: { apiKey: 'test-key' } },
      models: { chat: 'openai:gpt-5.4' },
    });

    expect(options.endpoints).toEqual({
      controller: true,
      guards: [],
      limits: expect.objectContaining({ maxMessages: expect.any(Number) }),
      prefix: 'ai',
      quota: { enabled: false, rules: [] },
    });
  });

  it('normalizes model objects with explicit capabilities', () => {
    const options = validateAiModuleOptions({
      providers: { openai: { apiKey: 'test-key' } },
      models: {
        chat: {
          providerModel: 'openai:gpt-5.4',
          capabilities: ['chat', 'tools'],
          label: 'Primary chat',
        },
      },
    });

    expect(options.models['chat']).toEqual({
      providerModel: 'openai:gpt-5.4',
      capabilities: ['chat', 'tools'],
      label: 'Primary chat',
    });
  });

  it('requires at least one model alias', () => {
    expect(() =>
      validateAiModuleOptions({
        providers: { openai: { apiKey: 'test-key' } },
        models: {},
      }),
    ).toThrow(AiException);
  });

  it('requires provider:model model references', () => {
    expect(() =>
      validateAiModuleOptions({
        providers: { openai: { apiKey: 'test-key' } },
        models: { chat: 'gpt-5.4' },
      }),
    ).toThrow(AiException);
  });

  it('normalizes disabled quota options by default', () => {
    const options = validateAiModuleOptions({
      providers: { openai: { apiKey: 'test-key' } },
      models: { chat: 'openai:gpt-5.4' },
    });

    expect(options.endpoints.quota).toEqual({ enabled: false, rules: [] });
  });

  it('requires quota storage when quota is enabled', () => {
    expect(() =>
      validateAiModuleOptions({
        providers: { openai: { apiKey: 'test-key' } },
        models: { chat: 'openai:gpt-5.4' },
        endpoints: {
          quota: {
            enabled: true,
            defaultLimits: [{ window: { unit: 'hour', size: 1 }, maxTokens: 20_000 }],
            rules: [],
          },
        },
      }),
    ).toThrow(AiException);
  });

  it('normalizes mongoose quota storage options', () => {
    const options = validateAiModuleOptions({
      providers: { openai: { apiKey: 'test-key' } },
      models: { chat: 'openai:gpt-5.4' },
      endpoints: {
        quota: {
          enabled: true,
          storage: 'mongoose',
          defaultLimits: [{ window: { unit: 'hour', size: 5 }, maxTokens: 50_000 }],
          rules: [{ roles: ['admin'], limits: [{ window: { unit: 'week', size: 1 }, maxTokens: 1_000_000 }] }],
          maxPromptTokens: 8_000,
        },
      },
    });

    expect(options.endpoints.quota).toEqual(
      expect.objectContaining({
        enabled: true,
        storage: 'mongoose',
        maxPromptTokens: 8_000,
        defaultLimits: [{ window: { unit: 'hour', size: 5 }, maxTokens: 50_000 }],
      }),
    );
  });
});
