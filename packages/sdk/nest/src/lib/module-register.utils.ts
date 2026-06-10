import type { InjectionToken, Provider } from '@nestjs/common';

import type {
  NestFeatureModuleAsyncOptions,
  NestFeatureModuleImport,
  NestFeatureModuleImportsSource,
} from './module-register.types';

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

export function createNestFeatureValueProvider<T>(
  token: InjectionToken,
  value: T,
): Provider {
  return {
    provide: token,
    useValue: value,
  };
}

export function createNestFeatureOptionsProvider<T>(
  token: InjectionToken,
  options: NestFeatureModuleAsyncOptions<T>,
): Provider {
  return createNestFeatureProvider(token, options.useFactory, options.inject);
}

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
