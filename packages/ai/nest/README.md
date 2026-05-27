# @otwld/nest-ai

NestJS integration for Vercel AI SDK v6.

```ts
import { AiModule } from '@otwld/nest-ai';
import { JwtAuthGuard } from '@otwld/nest-auth';

AiModule.forRoot({
  providers: {
    openai: { apiKey: process.env['OPENAI_API_KEY'] },
  },
  models: {
    chat: { providerModel: 'openai:gpt-5.4', capabilities: ['chat', 'tools'] },
    fast: { providerModel: 'openai:gpt-5.4-mini', capabilities: ['completion'] },
    structured: { providerModel: 'openai:gpt-5.4', capabilities: ['object'] },
  },
  endpoints: {
    prefix: 'ai',
    guards: [JwtAuthGuard],
    limits: {
      maxPromptLength: 12_000,
      maxMessageContentLength: 12_000,
      maxMessages: 40,
      maxOutputTokens: 2048,
      maxToolSteps: 5,
    },
  },
});
```

Default endpoints are mounted at `/ai/*` inside the backend app. Apps with a global `/api` prefix expose them as `/api/ai/*`.

Registered tools are executed on the backend and passed to Vercel AI SDK `streamText`/`generateText` calls. `maxToolSteps` controls the bounded multi-step loop that lets the model use a tool result and then produce a final assistant message in the same request.

For `forRootAsync`, endpoint routing options are static module options because Nest controllers and route prefixes are registered before async factories resolve:

```ts
AiModule.forRootAsync({
  endpoints: { prefix: 'ai', guards: [JwtAuthGuard] },
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    providers: { openai: { apiKey: config.get<string>('OPENAI_API_KEY') } },
    models: { chat: 'openai:gpt-5.4' },
  }),
});
```

## Quotas

AI endpoints can enforce token quotas with the generic `AiQuotaStorage` contract. The package ships `MongooseAiQuotaStorage`; no in-memory quota adapter is provided.

```ts
AiModule.forRootAsync({
  imports: [ConfigModule],
  endpoints: {
    prefix: 'ai',
    guards: [JwtAuthGuard],
    quota: {
      enabled: true,
      storage: 'mongoose',
      defaultLimits: [{ window: { unit: 'hour', size: 1 }, maxTokens: 20_000 }],
      rules: [
        { roles: ['admin'], limits: [{ window: { unit: 'week', size: 1 }, maxTokens: 1_000_000 }], maxPromptTokens: 16_000 },
        { roles: ['member'], limits: [{ window: { unit: 'hour', size: 5 }, maxTokens: 50_000 }], maxPromptTokens: 8_000 },
      ],
    },
  },
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    providers: { openai: { apiKey: config.get<string>('OPENAI_API_KEY') } },
    models: { chat: 'openai:gpt-5.4' },
  }),
});
```

`GET /ai/usage` returns the authenticated user's effective quota usage snapshot.
