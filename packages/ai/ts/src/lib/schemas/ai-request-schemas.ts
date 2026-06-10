import { z } from 'zod';

const metadataSchema = z.record(z.unknown()).optional();

/**
 * Validation limits applied to AI request payload schemas.
 *
 * These values protect server endpoints from unbounded prompt, message, tool,
 * and output-token payloads before provider-specific adapters are invoked.
 */
export interface AiRequestLimits {
  maxPromptLength: number;
  maxMessageContentLength: number;
  maxMessages: number;
  maxOutputTokens: number;
  maxToolSteps: number;
}

/**
 * Conservative default limits used by the exported AI request schemas.
 */
export const DEFAULT_AI_REQUEST_LIMITS: AiRequestLimits = {
  maxPromptLength: 16_000,
  maxMessageContentLength: 16_000,
  maxMessages: 64,
  maxOutputTokens: 4096,
  maxToolSteps: 5,
};

/**
 * Zod schema that validates and defaults AI request limit configuration.
 */
export const aiRequestLimitsSchema = z.object({
  maxPromptLength: z.number().int().positive().default(DEFAULT_AI_REQUEST_LIMITS.maxPromptLength),
  maxMessageContentLength: z.number().int().positive().default(DEFAULT_AI_REQUEST_LIMITS.maxMessageContentLength),
  maxMessages: z.number().int().positive().default(DEFAULT_AI_REQUEST_LIMITS.maxMessages),
  maxOutputTokens: z.number().int().positive().default(DEFAULT_AI_REQUEST_LIMITS.maxOutputTokens),
  maxToolSteps: z.number().int().positive().default(DEFAULT_AI_REQUEST_LIMITS.maxToolSteps),
});

/**
 * Normalizes partial AI request limits into a complete validated limit set.
 *
 * @param limits - Overrides for the default request limits.
 *
 * @returns Complete request limits with defaults applied.
 */
export function normalizeAiRequestLimits(limits: Partial<AiRequestLimits> = {}): AiRequestLimits {
  const parsed = aiRequestLimitsSchema.parse({ ...DEFAULT_AI_REQUEST_LIMITS, ...limits });

  return {
    maxPromptLength: parsed.maxPromptLength ?? DEFAULT_AI_REQUEST_LIMITS.maxPromptLength,
    maxMessageContentLength: parsed.maxMessageContentLength ?? DEFAULT_AI_REQUEST_LIMITS.maxMessageContentLength,
    maxMessages: parsed.maxMessages ?? DEFAULT_AI_REQUEST_LIMITS.maxMessages,
    maxOutputTokens: parsed.maxOutputTokens ?? DEFAULT_AI_REQUEST_LIMITS.maxOutputTokens,
    maxToolSteps: parsed.maxToolSteps ?? DEFAULT_AI_REQUEST_LIMITS.maxToolSteps,
  };
}

function createRequestOptionsSchema(limits: AiRequestLimits) {
  return {
    model: z.string().min(1).optional(),
    system: z.string().min(1).max(limits.maxPromptLength).optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxOutputTokens: z.number().int().positive().max(limits.maxOutputTokens).optional(),
    metadata: metadataSchema,
  };
}

function createUiMessagePartSchema(limits: AiRequestLimits) {
  return z
    .object({
      type: z.string().min(1),
    })
    .passthrough()
    .superRefine((part, context) => {
      if (part.type !== 'text') return;

      const text = (part as Record<string, unknown>)['text'];
      if (typeof text !== 'string' || text.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'text message parts require non-empty text',
          path: ['text'],
        });
        return;
      }

      if (text.length > limits.maxMessageContentLength) {
        context.addIssue({
          code: z.ZodIssueCode.too_big,
          maximum: limits.maxMessageContentLength,
          type: 'string',
          inclusive: true,
          message: `text message parts must contain at most ${limits.maxMessageContentLength} character(s)`,
          path: ['text'],
        });
      }
    });
}

function createAiMessageSchema(limits: AiRequestLimits) {
  return z
    .object({
      id: z.string().min(1).optional(),
      role: z.enum(['system', 'user', 'assistant', 'tool']),
      content: z.string().min(1).max(limits.maxMessageContentLength).optional(),
      parts: z.array(createUiMessagePartSchema(limits)).min(1).optional(),
      metadata: metadataSchema,
    })
    .passthrough()
    .superRefine((message, context) => {
      if (message.content || message.parts?.length) return;

      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'messages require either content or parts',
        path: ['content'],
      });
    });
}

/**
 * Creates AI request schemas with caller-provided validation limits.
 *
 * @param limits - Optional validation limits for the generated schemas.
 *
 * @returns Zod schemas for message, chat, completion, and object requests.
 */
export function createAiRequestSchemas(limits: Partial<AiRequestLimits> = {}) {
  const normalizedLimits = normalizeAiRequestLimits(limits);
  const requestOptionsSchema = createRequestOptionsSchema(normalizedLimits);
  const messageSchema = createAiMessageSchema(normalizedLimits);

  return {
    aiMessageSchema: messageSchema,
    aiChatRequestSchema: z.object({
      messages: z.array(messageSchema).min(1).max(normalizedLimits.maxMessages),
      ...requestOptionsSchema,
    }),
    aiCompletionRequestSchema: z.object({
      prompt: z.string().min(1).max(normalizedLimits.maxPromptLength),
      ...requestOptionsSchema,
    }),
    aiObjectRequestSchema: z.object({
      prompt: z.string().min(1).max(normalizedLimits.maxPromptLength),
      input: z.record(z.unknown()).optional(),
      ...requestOptionsSchema,
    }),
  };
}

const defaultSchemas = createAiRequestSchemas();

/**
 * Default schema for a single chat message payload.
 */
export const aiMessageSchema = defaultSchemas.aiMessageSchema;

/**
 * Default schema for chat-completion style request payloads.
 */
export const aiChatRequestSchema = defaultSchemas.aiChatRequestSchema;

/**
 * Default schema for single-prompt completion request payloads.
 */
export const aiCompletionRequestSchema = defaultSchemas.aiCompletionRequestSchema;

/**
 * Default schema for structured-object generation request payloads.
 */
export const aiObjectRequestSchema = defaultSchemas.aiObjectRequestSchema;

/**
 * Represents ai chat request input.
 */
export type AiChatRequestInput = z.infer<typeof aiChatRequestSchema>;
/**
 * Represents ai completion request input.
 */
export type AiCompletionRequestInput = z.infer<typeof aiCompletionRequestSchema>;
/**
 * Represents ai object request input.
 */
export type AiObjectRequestInput = z.infer<typeof aiObjectRequestSchema>;
