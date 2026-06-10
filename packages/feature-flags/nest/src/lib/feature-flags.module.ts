import { DynamicModule, Module, Provider } from '@nestjs/common';
import {
  collectNestFeatureModuleImports,
  type NestFeatureModuleFactoryProvider,
} from '@otwld/nest-sdk';
import { MongooseModule } from '@nestjs/mongoose';

import type { ConditionMetaMap, FeatureFlagCatalog } from '@otwld/ts-feature-flags';
import { FeatureFlag, FeatureFlagSchema } from './feature-flag.entity';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsResolver } from './feature-flags.resolver';
import { FeatureFlagsGuard } from './feature-flags.guard';
import { FeatureFlagsRepository } from './feature-flags.repository';
import { FeatureFlagsService } from './feature-flags.service';
import {
  FeatureFlagEvaluator,
  FeatureFlagsContextResolver,
  provideFeatureFlagsCatalog,
  provideFeatureFlagsConditionMetaMap,
  provideFeatureFlagsContextResolver,
  provideFeatureFlagsEvaluator,
} from './feature-flags.tokens';

/** Async provider contract used to configure feature-flags dependencies. */
export type FeatureFlagsFactoryProvider<T> =
  NestFeatureModuleFactoryProvider<T>;

/** Static options for registering the feature-flags module. */
export interface FeatureFlagsModuleOptions {
  conditionMetaMap: ConditionMetaMap;
  evaluator: FeatureFlagEvaluator;
  catalog?: FeatureFlagCatalog;
  contextResolver?: FeatureFlagsContextResolver;
}

/** Async options for registering the feature-flags module. */
export interface FeatureFlagsModuleAsyncOptions {
  conditionMetaMap: FeatureFlagsFactoryProvider<ConditionMetaMap>;
  evaluator: FeatureFlagsFactoryProvider<FeatureFlagEvaluator>;
  catalog?: FeatureFlagsFactoryProvider<FeatureFlagCatalog>;
  contextResolver?: FeatureFlagsFactoryProvider<FeatureFlagsContextResolver>;
}

/** Shared imports required by both static and async registration paths. */
const importsArr = [MongooseModule.forFeature([{ name: FeatureFlag.name, schema: FeatureFlagSchema }])];
/** Shared providers exposed by the module. */
const providersArr: Provider[] = [
  FeatureFlagsRepository,
  FeatureFlagsService,
  FeatureFlagsGuard,
  FeatureFlagsResolver,
];
/** Controller surface for the feature-flags admin/evaluation API. */
const controllersArr = [FeatureFlagsController];

/**
 * Feature flags module with configurable evaluator and condition metadata.
 */
@Module({})
export class FeatureFlagsModule {
  /**
   * Registers the module with static, synchronous options.
   */
  static register(options: FeatureFlagsModuleOptions): DynamicModule {
    const providers: Provider[] = [
      ...providersArr,
      provideFeatureFlagsEvaluator(() => options.evaluator),
      provideFeatureFlagsConditionMetaMap(() => options.conditionMetaMap),
    ];

    if (options.catalog) {
      const catalog = options.catalog;
      providers.push(provideFeatureFlagsCatalog(() => catalog));
    }

    if (options.contextResolver) {
      const contextResolver = options.contextResolver;
      providers.push(provideFeatureFlagsContextResolver(() => contextResolver));
    }

    return {
      module: FeatureFlagsModule,
      imports: [...importsArr],
      controllers: controllersArr,
      providers,
      exports: [FeatureFlagsService, FeatureFlagsRepository, FeatureFlagsGuard],
    };
  }

  /**
   * Registers the module with async factories.
   */
  static registerAsync(options: FeatureFlagsModuleAsyncOptions): DynamicModule {
    const asyncImports = collectNestFeatureModuleImports(
      importsArr,
      options.conditionMetaMap,
      options.evaluator,
      options.catalog,
      options.contextResolver,
    );

    const providers: Provider[] = [
      ...providersArr,
      provideFeatureFlagsEvaluator(options.evaluator.useFactory, options.evaluator.inject),
      provideFeatureFlagsConditionMetaMap(options.conditionMetaMap.useFactory, options.conditionMetaMap.inject),
    ];

    if (options.catalog) {
      providers.push(provideFeatureFlagsCatalog(options.catalog.useFactory, options.catalog.inject));
    }

    if (options.contextResolver) {
      providers.push(provideFeatureFlagsContextResolver(options.contextResolver.useFactory, options.contextResolver.inject));
    }

    return {
      module: FeatureFlagsModule,
      imports: asyncImports,
      controllers: controllersArr,
      providers,
      exports: [FeatureFlagsService, FeatureFlagsRepository, FeatureFlagsGuard],
    };
  }
}
