import { InjectionToken } from '@angular/core';

/** Angular storage client configuration. */
export interface StorageConfig {
  /** TUS endpoint used for resumable uploads. */
  tusEndpoint: string;
  /** Endpoint used to request signed read URLs. */
  signedUrlEndpoint: string;
  /** Default signed URL TTL in seconds. */
  defaultExpiresIn?: number;
  /** Retry delays in milliseconds for tus-js-client. */
  retryDelays?: number[];
  /** Default upload chunk size in bytes. */
  chunkSize?: number;
  /** Refresh signed URLs when they expire within this threshold. */
  signedUrlRefreshThresholdMs?: number;
}

/** Injection token for normalized storage configuration. */
export const STORAGE_CONFIG = new InjectionToken<Required<StorageConfig>>('storage.config');

/** Normalize partial storage configuration with defaults. */
/**
 * Runs normalize storage config.
 *
 * @param config - config value.
 *
 * @returns The normalize storage config result.
 */
export function normalizeStorageConfig(config: StorageConfig): Required<StorageConfig> {
  return {
    tusEndpoint: config.tusEndpoint,
    signedUrlEndpoint: config.signedUrlEndpoint,
    defaultExpiresIn: config.defaultExpiresIn ?? 3600,
    retryDelays: config.retryDelays ?? [0, 3000, 5000, 10000, 20000],
    chunkSize: config.chunkSize ?? 5 * 1024 * 1024,
    signedUrlRefreshThresholdMs: config.signedUrlRefreshThresholdMs ?? 60_000,
  };
}
