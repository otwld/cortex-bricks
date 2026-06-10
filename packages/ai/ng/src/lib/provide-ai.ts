import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AI_CONFIG, AiConfig, normalizeAiConfig } from './tokens/ai-config.token';

/**
 * Registers Angular AI client configuration providers.
 *
 * @param config - AI client configuration to normalize and provide.
 * @returns Environment providers for Angular AI services.
 */
export function provideAi(config: AiConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: AI_CONFIG,
      useValue: normalizeAiConfig(config),
    },
  ]);
}
