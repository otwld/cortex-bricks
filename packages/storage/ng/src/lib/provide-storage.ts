import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { normalizeStorageConfig, STORAGE_CONFIG, StorageConfig } from './tokens/storage-config.token';

/** Fully normalized storage configuration injected into services. */
export type RequiredStorageConfig = Required<StorageConfig>;

/**
 * Provides Angular storage configuration to directives, pipes, and services.
 *
 * @param config - Storage client configuration supplied by the host app.
 * @returns Environment providers for the Angular storage client.
 */
export function provideStorage(config: StorageConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: STORAGE_CONFIG,
      useValue: normalizeStorageConfig(config),
    },
  ]);
}
