import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import {
  createNestFeatureAsyncOptionsClassProvider,
  createNestFeatureAsyncOptionsProvider,
} from '@otwld/nest-sdk';
import {
  AI_ENDPOINT_OPTIONS,
  AI_MODULE_OPTIONS,
  ManualAiModuleAsyncOptions,
  NormalizedAiEndpointOptions,
  NormalizedAiModuleOptions,
  normalizeAiEndpointOptions,
  validateAiModuleOptions,
} from './config/ai-module-options';
import { AiModuleOptions, AiModuleOptionsFactory } from './config/ai-module-options';
import { AiController } from './controllers/ai.controller';
import { AiEndpointGuard } from './guards/ai-endpoint.guard';
import { AiProviderRegistryService } from './providers/ai-provider-registry.service';
import { AI_QUOTA_STORAGE } from './quota/ai-quota.tokens';
import { AiQuotaService } from './quota/ai-quota.service';
import { AiQuotaBucketRecord, AiQuotaBucketSchema } from './quota/mongoose-ai-quota.schema';
import { MongooseAiQuotaStorage } from './quota/mongoose-ai-quota.storage';
import { AiObjectSchemaRegistry } from './schemas/ai-object-schema.registry';
import { AiService } from './services/ai.service';
import { AiToolRegistry } from './tools/ai-tool.registry';

const AI_PROVIDERS = [AiProviderRegistryService, AiObjectSchemaRegistry, AiToolRegistry, AiService, AiEndpointGuard, AiQuotaService];

function createEndpointOptionsProvider(endpoints: NormalizedAiEndpointOptions): Provider {
  return { provide: AI_ENDPOINT_OPTIONS, useValue: endpoints };
}

function createEndpointImports(endpoints: NormalizedAiEndpointOptions): DynamicModule[] {
  return endpoints.controller ? [RouterModule.register([{ path: endpoints.prefix, module: AiModule }])] : [];
}

function createQuotaImports(endpoints: NormalizedAiEndpointOptions): DynamicModule[] {
  return endpoints.quota.enabled && endpoints.quota.storage === 'mongoose'
    ? [MongooseModule.forFeature([{ name: AiQuotaBucketRecord.name, schema: AiQuotaBucketSchema }])]
    : [];
}

function createQuotaProviders(endpoints: NormalizedAiEndpointOptions): Provider[] {
  if (!endpoints.quota.enabled) return [];
  if (endpoints.quota.storage === 'mongoose') {
    return [MongooseAiQuotaStorage, { provide: AI_QUOTA_STORAGE, useExisting: MongooseAiQuotaStorage }];
  }
  return [];
}

function createQuotaExports(endpoints: NormalizedAiEndpointOptions): Array<symbol | Type<unknown>> {
  if (!endpoints.quota.enabled) return [];
  if (endpoints.quota.storage === 'mongoose') return [MongooseAiQuotaStorage, AI_QUOTA_STORAGE];
  return [];
}

/** Nest module that wires AI providers, endpoint controllers, tools, schemas, and quota storage. */
@Module({})
export class AiModule {
  /** Configure AI providers and endpoints with synchronous options. */
  static forRoot(options: AiModuleOptions): DynamicModule {
    const validated = validateAiModuleOptions(options);
    return {
      module: AiModule,
      global: true,
      imports: [...createEndpointImports(validated.endpoints), ...createQuotaImports(validated.endpoints)],
      controllers: validated.endpoints.controller ? [AiController] : [],
      providers: [
        { provide: AI_MODULE_OPTIONS, useValue: validated },
        createEndpointOptionsProvider(validated.endpoints),
        ...AI_PROVIDERS,
        ...createQuotaProviders(validated.endpoints),
      ],
      exports: [AI_MODULE_OPTIONS, AI_ENDPOINT_OPTIONS, ...AI_PROVIDERS, ...createQuotaExports(validated.endpoints)],
    };
  }

  /** Configure AI providers and endpoints with an async factory or options class. */
  static forRootAsync(asyncOptions: ManualAiModuleAsyncOptions): DynamicModule {
    const endpoints = normalizeAiEndpointOptions(asyncOptions.endpoints);

    return {
      module: AiModule,
      global: true,
      imports: [...(asyncOptions.imports ?? []), ...createEndpointImports(endpoints), ...createQuotaImports(endpoints)],
      controllers: endpoints.controller ? [AiController] : [],
      providers: [
        createNestFeatureAsyncOptionsProvider<AiModuleOptions, AiModuleOptionsFactory, NormalizedAiModuleOptions>(
          AI_MODULE_OPTIONS,
          asyncOptions,
          'createAiOptions',
          async (options) => ({
            ...validateAiModuleOptions(options),
            endpoints,
          }),
        ),
        createEndpointOptionsProvider(endpoints),
        ...createNestFeatureAsyncOptionsClassProvider(asyncOptions),
        ...AI_PROVIDERS,
        ...createQuotaProviders(endpoints),
      ],
      exports: [AI_MODULE_OPTIONS, AI_ENDPOINT_OPTIONS, ...AI_PROVIDERS, ...createQuotaExports(endpoints)],
    };
  }
}
