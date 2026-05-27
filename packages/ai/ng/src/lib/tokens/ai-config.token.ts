import { InjectionToken } from '@angular/core';

/**
 * Describes ai config values.
 */
export interface AiConfig {
  apiBaseUrl: string;
  credentials?: RequestCredentials;
}

/**
 * Describes normalized ai config values.
 */
export interface NormalizedAiConfig {
  apiBaseUrl: string;
  credentials: RequestCredentials;
}

export const AI_CONFIG = new InjectionToken<NormalizedAiConfig>('AI_CONFIG');

/**
 * Runs normalize ai config.
 *
 * @param config - config value.
 *
 * @returns The normalize ai config result.
 */
export function normalizeAiConfig(config: AiConfig): NormalizedAiConfig {
  return {
    apiBaseUrl: config.apiBaseUrl.replace(/\/+$/, ''),
    credentials: config.credentials ?? 'same-origin',
  };
}
