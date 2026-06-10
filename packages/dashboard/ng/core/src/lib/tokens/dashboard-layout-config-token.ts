import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders, signal, WritableSignal } from '@angular/core';
import { DashboardLayoutConfig } from '../types/layout-types';

const DASHBOARD_LAYOUT_CONFIG_DEFAULT: DashboardLayoutConfig = {
  preset: 'Aura',
  primary: 'blue',
  surface: null,
  menuMode: 'static',
  menuTheme: 'colorScheme',
};

/**
 * Injection token for the mutable dashboard layout configuration signal.
 */
export const DASHBOARD_LAYOUT_CONFIG = new InjectionToken<WritableSignal<DashboardLayoutConfig>>('dashboardLayoutConfig');

/**
 * Provides dashboard layout configuration with package defaults applied.
 *
 * @param options - Initial layout configuration overrides.
 *
 * @returns Environment providers for the layout config signal.
 */
export function provideDashboardLayoutConfig(options: DashboardLayoutConfig = DASHBOARD_LAYOUT_CONFIG_DEFAULT): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: DASHBOARD_LAYOUT_CONFIG,
      useValue: signal({ ...DASHBOARD_LAYOUT_CONFIG_DEFAULT, ...options }),
    },
  ]);
}
