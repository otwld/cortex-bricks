/**
 * Represents color scheme.
 */
export type ColorScheme = 'light' | 'dark' | 'dim';

/**
 * Describes dashboard layout config values.
 */
export interface DashboardLayoutConfig {
  preset?: string;
  primary?: string;
  surface?: string | undefined | null;
  menuMode?: string;
  menuTheme?: string;
  colorScheme?: ColorScheme;
}

/**
 * Describes dashboard layout state values.
 */
export interface DashboardLayoutState {
  staticMenuInactive?: boolean;
  overlayMenuActive?: boolean;
  profileSidebarVisible?: boolean;
  configSidebarVisible?: boolean;
  mobileMenuActive?: boolean;
  searchBarActive?: boolean;
  sidebarExpanded?: boolean;
  menuHoverActive?: boolean;
  activePath?: string | null;
  anchored?: boolean;
}
