import type { Mock, Mocked } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import {
  convertToModelMessages,
  generateText,
  stepCountIs,
  streamText,
  type LanguageModel,
} from 'ai';
import { DEFAULT_AI_REQUEST_LIMITS } from '@otwld/ts-ai';
import { AiToolRegistry } from '../tools/ai-tool.registry';
import {
  AiService,
  type AiObjectSchemaRegistryPort,
  type AiProviderRegistryPort,
} from './ai.service';

vi.mock('ai', () => ({
  convertToModelMessages: vi.fn(),
  generateObject: vi.fn(),
  generateText: vi.fn(async () => ({ text: 'Generated text' })),
  stepCountIs: vi.fn((stepCount: number) => `stop-after-${stepCount}`),
  streamText: vi.fn(() => ({
    pipeTextStreamToResponse: vi.fn(),
    pipeUIMessageStreamToResponse: vi.fn(),
  })),
  tool: vi.fn((definition) => definition),
  zodSchema: vi.fn((schema) => schema),
}));

describe(AiService.name, () => {
  let providers: Mocked<
    AiProviderRegistryPort
  >;
  let schemas: Mocked<AiObjectSchemaRegistryPort>;
  let tools: AiToolRegistry;
  let service: AiService;

  beforeEach(() => {
    vi.clearAllMocks();
    providers = {
      listModels: vi.fn().mockReturnValue([]),
      resolveLanguageModel: vi.fn().mockReturnValue('resolved-model'),
    };
    schemas = {
      get: vi.fn().mockReturnValue(z.object({ title: z.string() })),
    };
    tools = new AiToolRegistry();
    service = new AiService(providers, schemas, tools, {
      limits: DEFAULT_AI_REQUEST_LIMITS,
    });
  });

  it('passes registered tools to streamed completions', async () => {
    tools.register({
      name: 'echo',
      description: 'Echo input',
      inputSchema: z.object({ value: z.string() }),
      execute: async ({ value }) => value,
    });

    service.streamCompletion({ prompt: 'Use a tool' });

    const options = (streamText as Mock).mock.calls[0][0];
    expect(options.tools.echo).toEqual(
      expect.objectContaining({
        description: 'Echo input',
        inputSchema: expect.any(Object),
      }),
    );
    expect(options.stopWhen).toBe(
      `stop-after-${DEFAULT_AI_REQUEST_LIMITS.maxToolSteps}`,
    );
    expect(stepCountIs).toHaveBeenCalledWith(
      DEFAULT_AI_REQUEST_LIMITS.maxToolSteps,
    );
    await expect(options.tools.echo.execute({ value: 'Hello' })).resolves.toBe(
      'Hello',
    );
  });

  it('does not use type-erasing AI SDK adapter casts', () => {
    expect(
      readFileSync(join(__dirname, 'ai.service.ts'), 'utf8'),
    ).not.toContain(['as', 'unknown', 'as'].join(' '));
  });

  it('streams chat through typed AI SDK APIs', async () => {
    const languageModel: LanguageModel = 'test-chat-model';
    providers.resolveLanguageModel.mockReturnValue(languageModel);
    (convertToModelMessages as Mock).mockResolvedValueOnce([
      { role: 'user', content: 'Hello' },
    ]);

    await service.streamChat({
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: languageModel,
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    );
  });

  it('passes registered tools to non-streaming completions', async () => {
    tools.register({
      name: 'echo',
      description: 'Echo input',
      inputSchema: z.object({ value: z.string() }),
      execute: async ({ value }) => value,
    });

    await service.complete({ prompt: 'Use a tool' });

    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        stopWhen: `stop-after-${DEFAULT_AI_REQUEST_LIMITS.maxToolSteps}`,
        tools: expect.objectContaining({ echo: expect.any(Object) }),
      }),
    );
  });

  it('leaves the default single-step stop condition alone when no tools are registered', () => {
    service.streamCompletion({ prompt: 'No tool needed' });

    expect(streamText).toHaveBeenCalledWith(
      expect.not.objectContaining({ stopWhen: expect.anything() }),
    );
  });

  it('converts rich UI messages to model messages for chat', async () => {
    (convertToModelMessages as Mock).mockResolvedValueOnce([
      { role: 'user', content: [{ type: 'text', text: 'Keep rich content' }] },
    ]);

    await service.streamChat({
      messages: [
        {
          id: 'message-1',
          role: 'user',
          parts: [
            { type: 'text', text: 'Keep rich content' },
            {
              type: 'file',
              mediaType: 'image/png',
              url: 'https://example.test/image.png',
            },
          ],
        },
      ],
    });

    expect(convertToModelMessages).toHaveBeenCalledWith(
      [
        {
          role: 'user',
          parts: [
            { type: 'text', text: 'Keep rich content' },
            {
              type: 'file',
              mediaType: 'image/png',
              url: 'https://example.test/image.png',
            },
          ],
        },
      ],
      expect.objectContaining({ ignoreIncompleteToolCalls: true }),
    );
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'Keep rich content' }],
          },
        ],
      }),
    );
  });
});
