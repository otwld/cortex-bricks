import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { normalizeStorageConfig, STORAGE_CONFIG, StorageConfig } from './tokens/storage-config.token';

/** Fully normalized storage configuration injected into services. */
export type RequiredStorageConfig = Required<StorageConfig>;

/** Provide Angular storage configuration to directives, pipes, and services. */
/**
 * Runs provide storage.
 *
 * @param config - config value.
 *
 * @returns The provide storage result.
 */
export function provideStorage(config: StorageConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: STORAGE_CONFIG,
      useValue: normalizeStorageConfig(config),
    },
  ]);
}
