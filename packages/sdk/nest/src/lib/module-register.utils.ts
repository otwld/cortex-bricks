import type { InjectionToken, Provider } from '@nestjs/common';

import type {
  NestFeatureModuleAsyncOptions,
  NestFeatureModuleImport,
  NestFeatureModuleImportsSource,
} from './module-register.types';

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
