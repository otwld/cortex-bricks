import { isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { DarkModeService } from '@otwld/ng-cdk';
import { DASHBOARD_LAYOUT_CONFIG } from '../tokens/dashboard-layout-config-token';
import { DASHBOARD_LAYOUT_STATE } from '../tokens/dashboard-layout-state-token';

/**
 * Coordinates dashboard layout configuration, transient menu state, and color-scheme controls.
 */
@Injectable()
export class DashboardLayoutService {
  private readonly router = inject(Router);
  private readonly darkMode = inject(DarkModeService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * Writable layout configuration shared by configurator, sidebar, and topbar components.
   */
  readonly layoutConfig = inject(DASHBOARD_LAYOUT_CONFIG);

  /**
   * Writable transient layout state for overlays, mobile menus, and active menu paths.
   */
  readonly layoutState = inject(DASHBOARD_LAYOUT_STATE);

  /**
   * Whether the global dark-mode service currently reports a dark color scheme.
   */
  readonly isDarkTheme = computed(() => this.darkMode.isDarkMode());

  /**
   * Whether the active menu mode is the compact slim sidebar.
   */
  readonly isSlim = computed(() => this.layoutConfig().menuMode === 'slim');

  /**
   * Whether the active menu mode is the expanded slim-plus sidebar.
   */
  readonly isSlimPlus = computed(() => this.layoutConfig().menuMode === 'slim-plus');

  /**
   * Whether the active menu mode renders root items horizontally.
   */
  readonly isHorizontal = computed(() => this.layoutConfig().menuMode === 'horizontal');

  /**
   * Whether the active menu mode uses an overlay sidebar.
   */
  readonly isOverlay = computed(() => this.layoutConfig().menuMode === 'overlay');

  /**
   * Whether the active menu mode opens submenu panels as overlays.
   */
  readonly hasOverlaySubmenu = computed(() => this.isSlim() || this.isSlimPlus() || this.isHorizontal());

  /**
   * Whether any overlay menu surface is currently open.
   */
  readonly hasOpenOverlay = computed(() => this.layoutState().overlayMenuActive || this.hasOpenOverlaySubmenu());

  /**
   * Whether an overlay submenu is open for the active menu path.
   */
  readonly hasOpenOverlaySubmenu = computed(() => {
    return this.hasOverlaySubmenu() && !!this.layoutState().activePath;
  });

  /**
   * Whether the active menu mode requires sidebar state to be recalculated.
   */
  readonly isSidebarStateChanged = computed(() => {
    const layoutConfig = this.layoutConfig();
    return layoutConfig.menuMode === 'horizontal' || layoutConfig.menuMode === 'slim' || layoutConfig.menuMode === 'slim-plus';
  });

  /**
   * Changes menu mode and clears transient state that is incompatible with the new mode.
   *
   * @param mode - Menu mode to persist in layout configuration.
   */
  changeMenuMode(mode: string) {
    this.layoutConfig.update((prev) => ({ ...prev, menuMode: mode }));
    this.layoutState.update((prev) => ({
      ...prev,
      staticMenuInactive: false,
      overlayMenuActive: false,
      mobileMenuActive: false,
      sidebarExpanded: false,
      menuHoverActive: false,
      anchored: false,
    }));

    if (this.isDesktop()) {
      this.layoutState.update((prev) => ({
        ...prev,
        activePath: this.hasOverlaySubmenu() ? null : this.router.url,
      }));
    }
  }

  private previousMenuMode: string | undefined = undefined;

  constructor() {
    effect(() => {
      this.updateMenuState();
    });
  }

  private updateMenuState() {
    const menuMode = this.layoutConfig().menuMode;
    if (this.previousMenuMode === undefined) {
      this.previousMenuMode = menuMode;
      return;
    }

    if (this.previousMenuMode === menuMode) {
      return;
    }

    this.previousMenuMode = menuMode;

    const isOverlaySubmenu = menuMode === 'slim' || menuMode === 'slim-plus' || menuMode === 'horizontal';

    this.layoutState.update((prev) => ({
      ...prev,
      staticMenuInactive: false,
      overlayMenuActive: false,
      mobileMenuActive: false,
      sidebarExpanded: false,
      menuHoverActive: false,
      anchored: false,
      activePath: this.isDesktop() ? (isOverlaySubmenu ? null : this.router.url) : prev.activePath,
    }));
  }

  /**
   * Toggles the global dark color scheme.
   */
  toggleDarkMode(): void {
    this.darkMode.toggleDarkMode();
  }

  /**
   * Toggles the appropriate desktop or mobile menu state for the current layout mode.
   */
  toggleMenu() {
    if (this.isDesktop()) {
      if (this.layoutConfig().menuMode === 'static') {
        this.layoutState.update((prev) => ({
          ...prev,
          staticMenuInactive: !prev.staticMenuInactive,
        }));
      }

      if (this.layoutConfig().menuMode === 'overlay') {
        this.layoutState.update((prev) => ({
          ...prev,
          overlayMenuActive: !prev.overlayMenuActive,
        }));
      }
    } else {
      this.layoutState.update((prev) => ({
        ...prev,
        mobileMenuActive: !prev.mobileMenuActive,
      }));
    }
  }

  /**
   * Toggles the profile sidebar visibility flag.
   */
  toggleProfileSidebar() {
    this.layoutState.update((prev) => ({
      ...prev,
      profileSidebarVisible: !prev.profileSidebarVisible,
    }));
  }

  /**
   * Toggles the layout configurator sidebar visibility flag.
   */
  toggleConfigSidebar() {
    this.layoutState.update((prev) => ({
      ...prev,
      configSidebarVisible: !prev.configSidebarVisible,
    }));
  }

  /**
   * Returns whether browser viewport width is above the dashboard desktop breakpoint.
   *
   * @returns True in browser contexts wider than 991px.
   */
  isDesktop() {
    return this.isBrowser && window.innerWidth > 991;
  }
}
