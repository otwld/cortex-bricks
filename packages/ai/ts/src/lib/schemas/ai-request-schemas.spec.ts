import {
  aiChatRequestSchema,
  aiCompletionRequestSchema,
  aiObjectRequestSchema,
  createAiRequestSchemas,
} from './ai-request-schemas';

describe('AI request schemas', () => {
  it('accepts a valid chat request', () => {
    const result = aiChatRequestSchema.parse({
      messages: [{ role: 'user', content: 'Write a release note' }],
      model: 'chat',
      temperature: 0.2,
    });

    expect(result.messages[0].role).toBe('user');
  });

  it('rejects chat requests without messages', () => {
    const result = aiChatRequestSchema.safeParse({ messages: [] });

    expect(result.success).toBe(false);
  });

  it('accepts Vercel UI message parts without flattening them', () => {
    const result = aiChatRequestSchema.parse({
      messages: [
        {
          id: 'message-1',
          role: 'user',
          parts: [
            { type: 'text', text: 'Summarize this image' },
            { type: 'file', mediaType: 'image/png', url: 'https://example.test/image.png' },
          ],
          metadata: { tenantId: 'tenant-a' },
        },
      ],
    });

    expect(result.messages[0]).toEqual(
      expect.objectContaining({
        id: 'message-1',
        parts: [
          { type: 'text', text: 'Summarize this image' },
          { type: 'file', mediaType: 'image/png', url: 'https://example.test/image.png' },
        ],
      }),
    );
  });

  it('enforces message and output-token limits', () => {
    const { aiChatRequestSchema: limitedChatSchema, aiCompletionRequestSchema: limitedCompletionSchema } = createAiRequestSchemas({
      maxMessageContentLength: 10,
      maxMessages: 1,
      maxOutputTokens: 100,
      maxPromptLength: 20,
    });

    expect(
      limitedChatSchema.safeParse({
        messages: [
          { role: 'user', content: 'first' },
          { role: 'user', content: 'second' },
        ],
      }).success,
    ).toBe(false);
    expect(limitedChatSchema.safeParse({ messages: [{ role: 'user', content: 'this message is too long' }] }).success).toBe(false);
    expect(limitedCompletionSchema.safeParse({ prompt: 'short prompt', maxOutputTokens: 101 }).success).toBe(false);
  });

  it('accepts a valid completion request', () => {
    const result = aiCompletionRequestSchema.parse({ prompt: 'Summarize this invoice', model: 'fast' });

    expect(result.prompt).toBe('Summarize this invoice');
  });

  it('accepts a valid object request', () => {
    const result = aiObjectRequestSchema.parse({
      prompt: 'Extract contact details',
      model: 'structured',
      input: { text: 'Ada Lovelace, ada@example.test' },
    });

    expect(result.input).toEqual({ text: 'Ada Lovelace, ada@example.test' });
  });

  it('enforces prompt limits for completion and object requests', () => {
    const { aiCompletionRequestSchema: limitedCompletionSchema, aiObjectRequestSchema: limitedObjectSchema } = createAiRequestSchemas({
      maxPromptLength: 8,
    });

    expect(limitedCompletionSchema.safeParse({ prompt: 'too long for this schema' }).success).toBe(false);
    expect(limitedObjectSchema.safeParse({ prompt: 'too long for this schema' }).success).toBe(false);
  });
});
