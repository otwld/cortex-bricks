import type { InjectionToken, Provider } from '@nestjs/common';

import type {
  NestFeatureModuleAsyncOptions,
  NestFeatureModuleClassAsyncOptions,
  NestFeatureModuleImport,
  NestFeatureModuleImportsSource,
  NestFeatureModuleOptionsFactoryMethod,
} from './module-register.types';

type OptionsNormalizer<TOptions, TResolvedOptions> = (
  options: TOptions,
) => Promise<TResolvedOptions> | TResolvedOptions;

function normalizeFeatureOptions<TOptions, TResolvedOptions>(
  options: TOptions,
  normalize?: OptionsNormalizer<TOptions, TResolvedOptions>,
): Promise<TOptions | TResolvedOptions> | TOptions | TResolvedOptions {
  return normalize ? normalize(options) : options;
}

/**
 * Creates a Nest provider backed by an options factory and optional dependency
 * injection tokens.
 */
export function createNestFeatureProvider<T>(
  token: InjectionToken,
  factory: (...args: unknown[]) => Promise<T> | T,
  inject: NestFeatureModuleAsyncOptions<T>['inject'] = [],
): Provider {
  return {
    provide: token,
    useFactory: (...args: unknown[]) => factory(...args),
    inject,
  };
}

/**
 * Creates a Nest value provider for already-normalized feature options.
 */
export function createNestFeatureValueProvider<T>(
  token: InjectionToken,
  value: T,
): Provider {
  return {
    provide: token,
    useValue: value,
  };
}

/**
 * Creates the options provider used by `registerAsync` feature-module helpers.
 */
export function createNestFeatureOptionsProvider<T>(
  token: InjectionToken,
  options: NestFeatureModuleAsyncOptions<T>,
): Provider {
  return createNestFeatureProvider(token, options.useFactory, options.inject);
}

/**
 * Creates the options provider used by feature modules that support factory,
 * class, and existing-provider async registration styles.
 */
export function createNestFeatureAsyncOptionsProvider<
  TOptions,
  TFactory,
  TResolvedOptions = TOptions,
>(
  token: InjectionToken,
  options: NestFeatureModuleClassAsyncOptions<TOptions, TFactory>,
  factoryMethod: NestFeatureModuleOptionsFactoryMethod<TFactory, TOptions>,
  normalize?: OptionsNormalizer<TOptions, TResolvedOptions>,
): Provider {
  const factory = options.useFactory;
  if (factory) {
    return {
      provide: token,
      useFactory: async (...args: unknown[]) =>
        normalizeFeatureOptions(await factory(...args), normalize),
      inject: options.inject ?? [],
    };
  }

  const factoryProvider = options.useClass ?? options.useExisting;
  if (!factoryProvider) {
    throw new Error(
      'Async feature module options require useFactory, useClass, or useExisting.',
    );
  }

  return {
    provide: token,
    useFactory: async (factory: TFactory) => {
      const createOptions = factory[factoryMethod] as unknown;
      if (typeof createOptions !== 'function') {
        throw new Error(
          `Async feature module factory is missing ${factoryMethod}().`,
        );
      }

      const optionsResult = await (
        createOptions as () => Promise<TOptions> | TOptions
      ).call(factory);

      return normalizeFeatureOptions(optionsResult, normalize);
    },
    inject: [factoryProvider],
  };
}

/**
 * Creates the class provider required by `useClass` async options.
 */
export function createNestFeatureAsyncOptionsClassProvider<TOptions, TFactory>(
  options: NestFeatureModuleClassAsyncOptions<TOptions, TFactory>,
): Provider[] {
  return options.useClass
    ? [{ provide: options.useClass, useClass: options.useClass }]
    : [];
}

/**
 * Collects unique Nest module imports from array and metadata sources.
 *
 * Import identity is reference-based and preserves the first-seen order, which
 * matches Nest module metadata behavior for dynamic module objects.
 */
export function collectNestFeatureModuleImports(
  ...sources: NestFeatureModuleImportsSource[]
): NestFeatureModuleImport[] {
  const imports: NestFeatureModuleImport[] = [];
  const seen = new Set<NestFeatureModuleImport>();

  for (const source of sources) {
    const candidates = Array.isArray(source) ? source : source?.imports ?? [];

    for (const candidate of candidates) {
      if (seen.has(candidate)) {
        continue;
      }

      seen.add(candidate);
      imports.push(candidate);
    }
  }

  return imports;
}
