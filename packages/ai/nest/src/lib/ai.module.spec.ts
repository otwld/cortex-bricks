import { CanActivate, DynamicModule } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AiModule } from './ai.module';
import { AI_ENDPOINT_OPTIONS } from './config/ai-module-options';
import { AiController } from './controllers/ai.controller';
import { AI_QUOTA_STORAGE } from './quota/ai-quota.tokens';
import { MongooseAiQuotaStorage } from './quota/mongoose-ai-quota.storage';

describe(AiModule.name, () => {
  const baseOptions = {
    providers: { openai: { apiKey: 'test-key' } },
    models: { chat: 'openai:gpt-5.4' },
  };

  it('registers the controller under the configured static prefix', () => {
    const moduleDefinition = AiModule.forRoot({
      ...baseOptions,
      endpoints: { prefix: 'agency-ai' },
    });

    const routerModule = moduleDefinition.imports?.find(
      (imported): imported is DynamicModule =>
        typeof imported === 'object' && imported !== null && (imported as DynamicModule).module === RouterModule,
    );
    const routesProvider = routerModule?.providers?.find(
      (provider) => typeof provider === 'object' && provider !== null && String(provider.provide) === 'Symbol(ROUTES)',
    ) as { useValue: unknown[] } | undefined;

    expect(moduleDefinition.controllers).toEqual([AiController]);
    expect(routesProvider?.useValue).toEqual([{ path: 'agency-ai', module: AiModule }]);
  });

  it('uses top-level async endpoint options to disable controller registration', () => {
    const moduleDefinition = AiModule.forRootAsync({
      endpoints: { controller: false },
      useFactory: () => baseOptions,
    });

    expect(moduleDefinition.controllers).toEqual([]);
    expect(
      moduleDefinition.imports?.some(
        (imported) => typeof imported === 'object' && imported !== null && (imported as DynamicModule).module === RouterModule,
      ),
    ).toBe(false);
  });

  it('exports normalized endpoint options for guards and controllers', () => {
    class TestGuard implements CanActivate {
      canActivate(): boolean {
        return true;
      }
    }

    const moduleDefinition = AiModule.forRoot({
      ...baseOptions,
      endpoints: { guards: [TestGuard] },
    });
    const endpointProvider = moduleDefinition.providers?.find(
      (provider) => typeof provider === 'object' && provider !== null && 'provide' in provider && provider.provide === AI_ENDPOINT_OPTIONS,
    ) as { useValue: unknown } | undefined;

    expect(endpointProvider?.useValue).toEqual(
      expect.objectContaining({
        controller: true,
        guards: [TestGuard],
        prefix: 'ai',
      }),
    );
  });

  it('registers mongoose quota storage when quota uses mongoose storage', () => {
    const moduleDefinition = AiModule.forRoot({
      ...baseOptions,
      endpoints: {
        quota: {
          enabled: true,
          storage: 'mongoose',
          defaultLimits: [{ window: { unit: 'hour', size: 1 }, maxTokens: 20_000 }],
          rules: [],
        },
      },
    });

    expect(moduleDefinition.imports).toEqual(
      expect.arrayContaining([expect.objectContaining({ module: MongooseModule })]),
    );
    expect(moduleDefinition.providers).toEqual(
      expect.arrayContaining([expect.objectContaining({ provide: AI_QUOTA_STORAGE, useExisting: MongooseAiQuotaStorage })]),
    );
  });
});
