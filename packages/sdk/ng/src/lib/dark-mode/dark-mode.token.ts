import { InjectionToken } from '@angular/core';
import { DarkModeConfig } from './dark-mode.types';

export const DEFAULT_DARK_MODE_CONFIG: Required<DarkModeConfig> = {
  className: 'app-dark',
  storageKey: 'otwld.dark-mode.preference',
  initialPreference: 'system',
  persistence: true,
  viewTransitions: true,
  fallbackDarkMode: true,
  autoSync: false,
};

export const DARK_MODE_CONFIG = new InjectionToken<Required<DarkModeConfig>>('darkModeConfig', {
  factory: () => DEFAULT_DARK_MODE_CONFIG,
});
