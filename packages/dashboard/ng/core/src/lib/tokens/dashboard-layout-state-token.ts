import { DashboardLayoutState } from '../types/layout-types';
import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders, signal, WritableSignal } from '@angular/core';

const DASHBOARD_LAYOUT_STATE_TOKEN_DEFAULT: DashboardLayoutState = {
  staticMenuInactive: false,
  overlayMenuActive: false,
  configSidebarVisible: false,
  mobileMenuActive: false,
  searchBarActive: false,
  sidebarExpanded: false,
  menuHoverActive: false,
  activePath: null,
  anchored: false,
  profileSidebarVisible: false,
};

/**
 * Injection token for the mutable dashboard layout state signal.
 */
export const DASHBOARD_LAYOUT_STATE = new InjectionToken<WritableSignal<DashboardLayoutState>>('DashboardLayoutState');

/**
 * Provides dashboard layout state with package defaults applied.
 *
 * @param options - Initial layout state overrides.
 *
 * @returns Environment providers for the layout state signal.
 */
export function provideDashboardLayoutState(options: DashboardLayoutState = DASHBOARD_LAYOUT_STATE_TOKEN_DEFAULT): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: DASHBOARD_LAYOUT_STATE,
      useValue: signal({ ...DASHBOARD_LAYOUT_STATE_TOKEN_DEFAULT, ...options }),
    },
  ]);
}
