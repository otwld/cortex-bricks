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

export const DASHBOARD_LAYOUT_STATE = new InjectionToken<WritableSignal<DashboardLayoutState>>('DashboardLayoutState');

/**
 * Runs provide dashboard layout state.
 *
 * @param options - options value.
 *
 * @returns The provide dashboard layout state result.
 */
export function provideDashboardLayoutState(options: DashboardLayoutState = DASHBOARD_LAYOUT_STATE_TOKEN_DEFAULT): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: DASHBOARD_LAYOUT_STATE,
      useValue: signal({ ...DASHBOARD_LAYOUT_STATE_TOKEN_DEFAULT, ...options }),
    },
  ]);
}
