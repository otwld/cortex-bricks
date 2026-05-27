import { AiChatRequest, AiCompletionRequest, AiObjectRequest } from '@otwld/ts-ai';

/** AI request kinds with token quota enforcement. */
export type AiQuotaRequestKind = 'chat' | 'completion' | 'object';

/** Request body accepted by quota prompt estimation. */
export type AiQuotaRequestBody = AiChatRequest | AiCompletionRequest | AiObjectRequest;

/** Estimates prompt tokens with a conservative character ratio. */
/**
 * Runs estimate prompt tokens.
 *
 * @param kind - kind value.
 *
 * @param request - request value.
 *
 * @returns The estimate prompt tokens result.
 */
export function estimatePromptTokens(kind: AiQuotaRequestKind, request: AiQuotaRequestBody): number {
  const text = collectPromptText(kind, request);
  return Math.max(1, Math.ceil(text.length / 4));
}

function collectPromptText(kind: AiQuotaRequestKind, request: AiQuotaRequestBody): string {
  const parts: string[] = [];
  if ('system' in request && request.system) parts.push(request.system);

  if (kind === 'completion' && 'prompt' in request) parts.push(request.prompt);
  if (kind === 'object' && 'prompt' in request) {
    parts.push(request.prompt);
    if ('input' in request && request.input) parts.push(JSON.stringify(request.input));
  }
  if (kind === 'chat' && 'messages' in request) {
    for (const message of request.messages) {
      if (message.content) parts.push(message.content);
      for (const part of message.parts ?? []) {
        const text = (part as Record<string, unknown>)['text'];
        if (typeof text === 'string') parts.push(text);
      }
    }
  }

  return parts.join('\n');
}
