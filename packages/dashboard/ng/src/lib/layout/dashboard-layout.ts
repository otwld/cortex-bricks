import { Component, computed, effect, inject, PLATFORM_ID, ViewEncapsulation } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardTopbar } from './components/dashboard-topbar';
import { DashboardSidebar } from './components/dashboard-sidebar';
import { DashboardConfigurator } from './components/dashboard-configurator';
import { DashboardProfileSidebar } from './components/dashboard-profile-sidebar';
import { DashboardLayoutService } from '@otwld/ng-dashboard/core';

/**
 * Provides dashboard layout behavior.
 */
@Component({
  selector: 'app-layout',
  imports: [CommonModule, DashboardTopbar, DashboardSidebar, RouterModule, DashboardConfigurator, DashboardProfileSidebar],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss',
  providers: [DashboardLayoutService],
  encapsulation: ViewEncapsulation.None,
})
export class DashboardLayout {
  layoutService = inject(DashboardLayoutService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    effect(() => {
      const mobileMenuActive = this.layoutService.layoutState().mobileMenuActive;
      if (this.isBrowser) {
        this.document.body.classList.toggle('blocked-scroll', mobileMenuActive);
      }
    });
  }

  containerClass = computed(() => {
    const layoutConfig = this.layoutService.layoutConfig();
    const layoutState = this.layoutService.layoutState();
    const darkModeEnabled = this.layoutService.isDarkTheme();

    return {
      'layout-light': !darkModeEnabled,
      'layout-dark': darkModeEnabled,
      'layout-colorscheme-menu': layoutConfig.menuTheme === 'colorScheme',
      'layout-primarycolor-menu': layoutConfig.menuTheme === 'primaryColor',
      'layout-transparent-menu': layoutConfig.menuTheme === 'transparent',
      'layout-overlay': layoutConfig.menuMode === 'overlay',
      'layout-static': layoutConfig.menuMode === 'static',
      'layout-slim': layoutConfig.menuMode === 'slim',
      'layout-slim-plus': layoutConfig.menuMode === 'slim-plus',
      'layout-horizontal': layoutConfig.menuMode === 'horizontal',
      'layout-reveal': layoutConfig.menuMode === 'reveal',
      'layout-drawer': layoutConfig.menuMode === 'drawer',
      'layout-static-inactive': layoutState.staticMenuInactive && layoutConfig.menuMode === 'static',
      'layout-overlay-active': layoutState.overlayMenuActive,
      'layout-mobile-active': layoutState.mobileMenuActive,
      'layout-sidebar-expanded': layoutState.sidebarExpanded,
      'layout-sidebar-anchored': layoutState.anchored,
    };
  });
}
