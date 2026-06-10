import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer, Provider } from '@angular/core';
import { DarkModeService } from './dark-mode.service';
import { DARK_MODE_CONFIG, DEFAULT_DARK_MODE_CONFIG } from './dark-mode.token';
import { DarkModeConfig } from './dark-mode.types';

/**
 * Registers dark-mode configuration and optional auto-sync initialization.
 *
 * @param config - Partial dark-mode configuration merged with defaults.
 * @returns Environment providers for dark-mode services.
 */
export function provideDarkMode(config: DarkModeConfig = {}): EnvironmentProviders {
  const resolvedConfig = { ...DEFAULT_DARK_MODE_CONFIG, ...config };
  const providers: Array<Provider | EnvironmentProviders> = [
    {
      provide: DARK_MODE_CONFIG,
      useValue: resolvedConfig,
    },
  ];

  if (resolvedConfig.autoSync) {
    providers.push(
      provideAppInitializer(() => {
        inject(DarkModeService);
      }),
    );
  }

  return makeEnvironmentProviders(providers);
}
