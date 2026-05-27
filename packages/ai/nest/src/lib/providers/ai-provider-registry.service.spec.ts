import { Test } from '@nestjs/testing';
import { AI_MODULE_OPTIONS } from '../config/ai-module-options';
import { AiException } from '../exceptions/ai.exception';
import { AiProviderRegistryService } from './ai-provider-registry.service';

describe('AiProviderRegistryService', () => {
  async function createService() {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiProviderRegistryService,
        {
          provide: AI_MODULE_OPTIONS,
          useValue: {
            providers: { openai: { apiKey: 'test-key' } },
            models: {
              chat: { providerModel: 'openai:gpt-5.4', capabilities: ['chat', 'tools'], label: 'Primary chat' },
              fast: { providerModel: 'openai:gpt-5.4-mini', capabilities: ['completion'] },
            },
            endpoints: { controller: true, guards: [], limits: { maxMessageContentLength: 100, maxMessages: 5, maxOutputTokens: 100, maxPromptLength: 100 }, prefix: 'ai' },
          },
        },
      ],
    }).compile();

    return moduleRef.get(AiProviderRegistryService);
  }

  it('lists configured model aliases', async () => {
    const service = await createService();

    expect(service.listModels()).toEqual([
      { alias: 'chat', providerModel: 'openai:gpt-5.4', capabilities: ['chat', 'tools'], label: 'Primary chat' },
      { alias: 'fast', providerModel: 'openai:gpt-5.4-mini', capabilities: ['completion'] },
    ]);
  });

  it('throws for unknown aliases', async () => {
    const service = await createService();

    expect(() => service.resolveModelReference('missing')).toThrow(AiException);
  });
});
