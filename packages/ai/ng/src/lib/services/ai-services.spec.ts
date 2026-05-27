import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AiErrorCode } from '@otwld/ts-ai';
import { provideAi } from '../provide-ai';
import { AiChatService } from './ai-chat.service';
import { AiCompletionService } from './ai-completion.service';
import { AiModelsService } from './ai-models.service';
import { AiObjectService } from './ai-object.service';
import { AiUsageService } from './ai-usage.service';

describe('AI Angular services', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAi({ apiBaseUrl: '/api/ai' })],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.inject(HttpTestingController).verify();
  });

  it('loads model aliases', async () => {
    const service = TestBed.inject(AiModelsService);
    const http = TestBed.inject(HttpTestingController);
    const promise = service.list();

    http.expectOne('/api/ai/models').flush([{ alias: 'chat', providerModel: 'openai:gpt-5.4', capabilities: ['chat'] }]);

    await expect(promise).resolves.toEqual([{ alias: 'chat', providerModel: 'openai:gpt-5.4', capabilities: ['chat'] }]);
  });

  it('posts object generation requests', async () => {
    const service = TestBed.inject(AiObjectService);
    const http = TestBed.inject(HttpTestingController);
    const promise = service.generate('summary', { prompt: 'Summarize this' });

    const request = http.expectOne('/api/ai/object/summary');
    expect(request.request.method).toBe('POST');
    request.flush({ object: { title: 'Demo' } });

    await expect(promise).resolves.toEqual({ title: 'Demo' });
  });

  it('loads the current AI quota usage snapshot', async () => {
    const service = TestBed.inject(AiUsageService);
    const http = TestBed.inject(HttpTestingController);
    const promise = service.snapshot();

    http.expectOne('/api/ai/usage').flush({
      subject: { type: 'user', id: 'user-1', roles: ['member'] },
      maxPromptTokens: 8_000,
      buckets: [
        {
          window: { unit: 'hour', size: 1 },
          limitTokens: 20_000,
          usedTokens: 5_000,
          reservedTokens: 0,
          remainingTokens: 15_000,
          resetAt: '2026-05-08T08:00:00.000Z',
          exceeded: false,
        },
      ],
    });

    await expect(promise).resolves.toEqual(expect.objectContaining({ maxPromptTokens: 8_000 }));
  });

  it('sends raw Vercel UI message parts through the chat transport', async () => {
    const service = TestBed.inject(AiChatService);
    const chat = service.createChat({ model: 'chat' });
    const transport = (chat as unknown as { transport: { prepareSendMessagesRequest: (options: Record<string, unknown>) => Promise<{ body: unknown }> } })
      .transport;
    const message = {
      id: 'message-1',
      role: 'user',
      parts: [
        { type: 'text', text: 'Read this file' },
        { type: 'file', mediaType: 'text/plain', url: 'data:text/plain;base64,SGVsbG8=' },
      ],
      metadata: { source: 'sandbox' },
    };

    const request = await transport.prepareSendMessagesRequest({
      api: '/api/ai/chat',
      body: { traceId: 'trace-1' },
      credentials: undefined,
      headers: {},
      id: 'chat-1',
      messageId: 'message-1',
      messages: [message],
      requestMetadata: undefined,
      trigger: 'submit-message',
    });

    expect(request.body).toEqual({
      model: 'chat',
      traceId: 'trace-1',
      messages: [message],
    });
  });

  it('rejects completion HTTP failures instead of resolving empty text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('server exploded', { status: 500 })));

    const service = TestBed.inject(AiCompletionService);

    await expect(service.complete({ prompt: 'Hello' })).rejects.toMatchObject({
      code: AiErrorCode.STREAM_FAILED,
      message: 'server exploded',
    });
    expect(service.error()).toEqual(expect.objectContaining({ code: AiErrorCode.STREAM_FAILED, message: 'server exploded' }));
  });
});
