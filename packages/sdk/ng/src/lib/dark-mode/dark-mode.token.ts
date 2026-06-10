import { InjectionToken } from '@angular/core';
import { DarkModeConfig } from './dark-mode.types';

/**
 * Default browser dark-mode behavior used when no provider overrides are set.
 */
export const DEFAULT_DARK_MODE_CONFIG: Required<DarkModeConfig> = {
  className: 'app-dark',
  storageKey: 'otwld.dark-mode.preference',
  initialPreference: 'system',
  persistence: true,
  viewTransitions: true,
  fallbackDarkMode: true,
  autoSync: false,
};

/**
 * Injection token for normalized dark-mode configuration.
 */
export const DARK_MODE_CONFIG = new InjectionToken<Required<DarkModeConfig>>('darkModeConfig', {
  factory: () => DEFAULT_DARK_MODE_CONFIG,
});
