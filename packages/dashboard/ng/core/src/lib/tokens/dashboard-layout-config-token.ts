import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders, signal, WritableSignal } from '@angular/core';
import { DashboardLayoutConfig } from '../types/layout-types';

const DASHBOARD_LAYOUT_CONFIG_DEFAULT: DashboardLayoutConfig = {
  preset: 'Aura',
  primary: 'blue',
  surface: null,
  menuMode: 'static',
  menuTheme: 'colorScheme',
};

export const DASHBOARD_LAYOUT_CONFIG = new InjectionToken<WritableSignal<DashboardLayoutConfig>>('dashboardLayoutConfig');

/**
 * Runs provide dashboard layout config.
 *
 * @param options - options value.
 *
 * @returns The provide dashboard layout config result.
 */
export function provideDashboardLayoutConfig(options: DashboardLayoutConfig = DASHBOARD_LAYOUT_CONFIG_DEFAULT): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: DASHBOARD_LAYOUT_CONFIG,
      useValue: signal({ ...DASHBOARD_LAYOUT_CONFIG_DEFAULT, ...options }),
    },
  ]);
}
