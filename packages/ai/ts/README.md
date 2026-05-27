# @otwld/ts-ai

Shared AI request, response, stream, model, tool, usage, and error contracts.

```ts
import { AiChatRequest, aiChatRequestSchema, createAiRequestSchemas } from '@otwld/ts-ai';

const request: AiChatRequest = {
  messages: [{ role: 'user', content: 'Summarize this ticket' }],
  model: 'chat',
};

aiChatRequestSchema.parse(request);
```

Use `createAiRequestSchemas()` when an app needs tighter prompt, message, or output-token limits:

```ts
const { aiChatRequestSchema } = createAiRequestSchemas({
  maxPromptLength: 12_000,
  maxMessageContentLength: 12_000,
  maxMessages: 40,
  maxOutputTokens: 2048,
});
```

## Quota contracts

`ts-ai` exports quota policy and usage contracts shared by `nest-ai` and `ng-ai`:

```ts
import { AiQuotaPolicy, AiQuotaUsageSnapshot } from '@otwld/ts-ai';

const policy: AiQuotaPolicy = {
  enabled: true,
  storage: 'mongoose',
  defaultLimits: [{ window: { unit: 'hour', size: 1 }, maxTokens: 20_000 }],
  rules: [{ roles: ['member'], limits: [{ window: { unit: 'hour', size: 5 }, maxTokens: 50_000 }] }],
};
```
