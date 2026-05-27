import { isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { DarkModeService } from '@otwld/ng-cdk';
import { DASHBOARD_LAYOUT_CONFIG } from '../tokens/dashboard-layout-config-token';
import { DASHBOARD_LAYOUT_STATE } from '../tokens/dashboard-layout-state-token';

/**
 * Provides dashboard layout service behavior.
 */
@Injectable()
export class DashboardLayoutService {
  private readonly router = inject(Router);
  private readonly darkMode = inject(DarkModeService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly layoutConfig = inject(DASHBOARD_LAYOUT_CONFIG);
  readonly layoutState = inject(DASHBOARD_LAYOUT_STATE);

  readonly isDarkTheme = computed(() => this.darkMode.isDarkMode());

  readonly isSlim = computed(() => this.layoutConfig().menuMode === 'slim');

  readonly isSlimPlus = computed(() => this.layoutConfig().menuMode === 'slim-plus');

  readonly isHorizontal = computed(() => this.layoutConfig().menuMode === 'horizontal');

  readonly isOverlay = computed(() => this.layoutConfig().menuMode === 'overlay');

  readonly hasOverlaySubmenu = computed(() => this.isSlim() || this.isSlimPlus() || this.isHorizontal());

  readonly hasOpenOverlay = computed(() => this.layoutState().overlayMenuActive || this.hasOpenOverlaySubmenu());

  readonly hasOpenOverlaySubmenu = computed(() => {
    return this.hasOverlaySubmenu() && !!this.layoutState().activePath;
  });

  readonly isSidebarStateChanged = computed(() => {
    const layoutConfig = this.layoutConfig();
    return layoutConfig.menuMode === 'horizontal' || layoutConfig.menuMode === 'slim' || layoutConfig.menuMode === 'slim-plus';
  });

  /**
   * Runs change menu mode.
   *
   * @param mode - mode value.
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
   * Runs toggle dark mode.
   */
  toggleDarkMode(): void {
    this.darkMode.toggleDarkMode();
  }

  /**
   * Runs toggle menu.
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
   * Runs toggle profile sidebar.
   */
  toggleProfileSidebar() {
    this.layoutState.update((prev) => ({
      ...prev,
      profileSidebarVisible: !prev.profileSidebarVisible,
    }));
  }

  /**
   * Runs toggle config sidebar.
   */
  toggleConfigSidebar() {
    this.layoutState.update((prev) => ({
      ...prev,
      configSidebarVisible: !prev.configSidebarVisible,
    }));
  }

  /**
   * Runs is desktop.
   *
   * @returns The dashboard layout service is desktop result.
   */
  isDesktop() {
    return this.isBrowser && window.innerWidth > 991;
  }
}
