import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AI_CONFIG, AiConfig, normalizeAiConfig } from './tokens/ai-config.token';

/**
 * Runs provide ai.
 *
 * @param config - config value.
 *
 * @returns The provide ai result.
 */
export function provideAi(config: AiConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: AI_CONFIG,
      useValue: normalizeAiConfig(config),
    },
  ]);
}
