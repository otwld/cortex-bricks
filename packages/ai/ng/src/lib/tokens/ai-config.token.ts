import { InjectionToken } from '@angular/core';

/**
 * Browser AI client configuration supplied by `provideAi`.
 */
export interface AiConfig {
  apiBaseUrl: string;
  credentials?: RequestCredentials;
}

/**
 * AI client configuration after URL and credentials defaults are applied.
 */
export interface NormalizedAiConfig {
  apiBaseUrl: string;
  credentials: RequestCredentials;
}

/**
 * Injection token for normalized browser AI client configuration.
 */
export const AI_CONFIG = new InjectionToken<NormalizedAiConfig>('AI_CONFIG');

/**
 * Normalizes browser AI configuration for service consumption.
 *
 * @param config - Raw AI configuration from `provideAi`.
 *
 * @returns Configuration with trailing API URL slashes removed.
 */
export function normalizeAiConfig(config: AiConfig): NormalizedAiConfig {
  return {
    apiBaseUrl: config.apiBaseUrl.replace(/\/+$/, ''),
    credentials: config.credentials ?? 'same-origin',
  };
}
