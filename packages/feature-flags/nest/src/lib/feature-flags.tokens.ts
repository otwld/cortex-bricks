import { InjectionToken, OptionalFactoryDependency, Provider } from '@nestjs/common';
import { createNestFeatureProvider } from '@otwld/nest-sdk';
import type {
  ConditionMetaMap,
  FeatureCondition,
  FeatureFlagCatalog,
  FeatureFlagContext,
  FeatureFlagAppContext,
  FeatureFlagUserContext,
} from '@otwld/ts-feature-flags';

/**
 * Evaluator behavior options for primitive condition comparison.
 */
export interface FeatureFlagEvaluatorOptions {
  string?: {
    caseSensitive?: boolean;
    trim?: boolean;
    normalize?: 'NFC' | 'NFD' | 'NFKC' | 'NFKD' | null;
  };
  number?: {
    parseStringNumbers?: boolean;
  };
  boolean?: {
    coerceCommonStrings?: boolean;
  };
}

/**
 * Adapter interface: your evaluator implementation should implement this.
 */
export interface FeatureFlagEvaluator {
  test(condition: FeatureCondition, context: FeatureFlagContext): Promise<boolean>;
}

/**
 * Resolves feature-flag evaluation context from the active request.
 */
export interface FeatureFlagsContextResolver {
  resolveAppContext(request: unknown): Promise<FeatureFlagAppContext>;
  resolveUserContext(request: unknown): Promise<FeatureFlagUserContext>;
}

/**
 * Injection token for the condition evaluator implementation.
 */
export const FEATURE_FLAGS_EVALUATOR_TOKEN = Symbol('FEATURE_FLAGS_EVALUATOR_TOKEN');

/**
 * Injection token for resolved condition metadata grouped by subject.
 */
export const FEATURE_FLAGS_CONDITION_META_MAP_TOKEN = Symbol('FEATURE_FLAGS_CONDITION_META_MAP_TOKEN');

/**
 * Injection token for the optional feature-flag catalog.
 */
export const FEATURE_FLAGS_CATALOG_TOKEN = Symbol('FEATURE_FLAGS_CATALOG_TOKEN');

/**
 * Injection token for request-to-context resolution.
 */
export const FEATURE_FLAGS_CONTEXT_RESOLVER_TOKEN = Symbol('FEATURE_FLAGS_CONTEXT_RESOLVER_TOKEN');

/**
 * Provides the evaluator implementation through DI.
 */
export function provideFeatureFlagsEvaluator(
  factory: (...args: unknown[]) => Promise<FeatureFlagEvaluator> | FeatureFlagEvaluator,
  inject: Array<InjectionToken | OptionalFactoryDependency> = [],
): Provider {
  return createNestFeatureProvider(
    FEATURE_FLAGS_EVALUATOR_TOKEN,
    factory,
    inject,
  );
}

/**
 * Provides the condition meta map through DI.
 */
export function provideFeatureFlagsConditionMetaMap(
  factory: (...args: unknown[]) => Promise<ConditionMetaMap> | ConditionMetaMap,
  inject: Array<InjectionToken | OptionalFactoryDependency> = [],
): Provider {
  return createNestFeatureProvider(
    FEATURE_FLAGS_CONDITION_META_MAP_TOKEN,
    factory,
    inject,
  );
}

/**
 * Provides the optional feature catalog through DI.
 */
export function provideFeatureFlagsCatalog(
  factory: (...args: unknown[]) => Promise<FeatureFlagCatalog> | FeatureFlagCatalog,
  inject: Array<InjectionToken | OptionalFactoryDependency> = [],
): Provider {
  return createNestFeatureProvider(FEATURE_FLAGS_CATALOG_TOKEN, factory, inject);
}

/**
 * Provides the request context resolver used by guards.
 */
export function provideFeatureFlagsContextResolver(
  factory: (...args: unknown[]) => Promise<FeatureFlagsContextResolver> | FeatureFlagsContextResolver,
  inject: Array<InjectionToken | OptionalFactoryDependency> = [],
): Provider {
  return createNestFeatureProvider(
    FEATURE_FLAGS_CONTEXT_RESOLVER_TOKEN,
    factory,
    inject,
  );
}
