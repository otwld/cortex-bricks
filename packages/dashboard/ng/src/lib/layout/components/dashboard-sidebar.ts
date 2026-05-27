import { afterNextRender, Component, computed, DestroyRef, effect, ElementRef, inject, OnDestroy, PLATFORM_ID, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { DashboardMenu } from './dashboard-menu';
import { WA_WINDOW } from '@ng-web-apis/common';
import { isPlatformServer } from '@angular/common';
import { DashboardLayoutService } from '@otwld/ng-dashboard/core';

const BREAKPOINT = 992;

@Component({
  selector: 'dashboard-sidebar',
  imports: [DashboardMenu, RouterModule],
  template: ` <div #sidebarRef class="layout-sidebar" (mouseenter)="onMouseEnter()" (mouseleave)="onMouseLeave()">
    <div class="sidebar-header">
      <a [routerLink]="['/']" class="app-logo">
        <img class="app-logo-normal" src="./logo.png" alt="logo" />
        <img class="app-logo-small" src="./logo_small_white.png" alt="logo" />
      </a>
      <button class="layout-sidebar-anchor p-link z-2 hover:cursor-pointer" type="button" (click)="onAnchorToggle()">
        <span class="sr-only">Toggle sidebar pin</span>
      </button>
    </div>

    <div #menuContainer class="layout-menu-container" (scroll)="onMenuScroll()">
      <dashboard-menu />
    </div>
  </div>`,
})
export class DashboardSidebar implements OnDestroy {
  private readonly window = inject(WA_WINDOW);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  layoutService = inject(DashboardLayoutService);

  router = inject(Router);

  el = inject(ElementRef);

  readonly menuContainer = viewChild.required<ElementRef>('menuContainer');

  private timeout: ReturnType<typeof setTimeout> | null = null;

  private observer: IntersectionObserver | null = null;

  private outsideClickListener: ((event: MouseEvent) => void) | null = null;

  private destroy$ = new Subject<void>();

  isDrawer = computed(() => this.layoutService.layoutConfig().menuMode === 'drawer');

  isReveal = computed(() => this.layoutService.layoutConfig().menuMode === 'reveal');

  isAnchored = computed(() => this.layoutService.layoutState().anchored);

  constructor() {
    effect(() => {
      if (isPlatformServer(this.platformId)) return;
      const hasOpenOverlay = this.layoutService.hasOpenOverlay();
      const mobileMenuActive = this.layoutService.layoutState().mobileMenuActive;

      if (this.layoutService.isDesktop()) {
        if (hasOpenOverlay) {
          this.bindOutsideClickListener();
        } else {
          this.unbindOutsideClickListener();
        }
      } else {
        if (mobileMenuActive) {
          this.bindOutsideClickListener();
        } else {
          this.unbindOutsideClickListener();
        }
      }
    });

    effect(() => {
      const hasOpenOverlaySubmenu = this.layoutService.hasOpenOverlaySubmenu();
      if (this.layoutService.isDesktop()) {
        if (hasOpenOverlaySubmenu) {
          setTimeout(() => this.setupIntersectionObserver());
        } else {
          this.unbindObserver();
        }
      }
    });

    afterNextRender(() => {
      const mediaQuery = this.window.matchMedia(`(min-width: ${BREAKPOINT}px)`);

      this.router.events
        .pipe(
          filter((event) => event instanceof NavigationEnd),
          takeUntil(this.destroy$),
        )
        .subscribe((event) => {
          const navEvent = event as NavigationEnd;
          this.onRouteChange(navEvent.urlAfterRedirects);
        });

      this.onRouteChange(this.router.url);

      mediaQuery.addEventListener('change', this.screenChangeListener);
      this.destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', this.screenChangeListener));
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.unbindOutsideClickListener();
    this.unbindObserver();
  }

  private onRouteChange(path: string) {
    let newActivePath: string | null;

    if (this.layoutService.hasOverlaySubmenu() && this.layoutService.isDesktop()) {
      newActivePath = null;
    } else {
      newActivePath = path;
    }

    this.layoutService.layoutState.update((val) => ({
      ...val,
      activePath: newActivePath,
      overlayMenuActive: false,
      staticMenuMobileActive: false,
      menuHoverActive: false,
    }));
  }

  private screenChangeListener = () => {
    if (this.layoutService.hasOverlaySubmenu()) {
      this.layoutService.layoutState.update((val) => ({
        ...val,
        activePath: this.layoutService.isDesktop() ? null : this.router.url,
        menuHoverActive: false,
      }));
      this.unbindOutsideClickListener();
      this.unbindObserver();
    }
  };

  private bindOutsideClickListener() {
    if (!this.outsideClickListener) {
      this.outsideClickListener = (event: MouseEvent) => {
        if (this.isOutsideClicked(event)) {
          if (this.layoutService.isDesktop()) {
            this.layoutService.layoutState.update((val) => ({
              ...val,
              overlayMenuActive: false,
            }));

            if (this.layoutService.hasOverlaySubmenu()) {
              this.layoutService.layoutState.update((val) => ({
                ...val,
                activePath: null,
                menuHoverActive: false,
              }));
            }
          } else {
            this.layoutService.layoutState.update((val) => ({
              ...val,
              mobileMenuActive: false,
            }));
          }
        }
      };

      document.addEventListener('click', this.outsideClickListener);
    }
  }

  private unbindOutsideClickListener() {
    if (this.outsideClickListener) {
      document.removeEventListener('click', this.outsideClickListener);
      this.outsideClickListener = null;
    }
  }

  private isOutsideClicked(event: MouseEvent): boolean {
    const topbarButtonEl = document.querySelector('.topbar-left > a');
    const sidebarEl = this.el.nativeElement;

    return !(
      sidebarEl?.isSameNode(event.target as Node) ||
      sidebarEl?.contains(event.target as Node) ||
      topbarButtonEl?.isSameNode(event.target as Node) ||
      topbarButtonEl?.contains(event.target as Node)
    );
  }

  onMouseEnter() {
    if (!this.isAnchored() && (this.isDrawer() || this.isReveal())) {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
      this.layoutService.layoutState.update((state) => ({
        ...state,
        sidebarExpanded: true,
      }));
    }
  }

  onMouseLeave() {
    if (!this.isAnchored() && !this.timeout) {
      this.timeout = setTimeout(() => {
        this.layoutService.layoutState.update((state) => ({
          ...state,
          sidebarExpanded: false,
        }));
      }, 300);
    }
  }

  onAnchorToggle() {
    this.layoutService.layoutState.update((state) => ({
      ...state,
      anchored: !state.anchored,
    }));
  }

  onMenuScroll() {
    const menuContainer = this.menuContainer();
    if (menuContainer?.nativeElement) {
      if (this.layoutService.isHorizontal()) {
        const scrollLeft = menuContainer.nativeElement.scrollLeft;
        menuContainer.nativeElement.style.setProperty('--menu-scroll-x', `-${scrollLeft}px`);
      } else {
        const scrollTop = menuContainer.nativeElement.scrollTop;
        menuContainer.nativeElement.style.setProperty('--menu-scroll-y', `-${scrollTop}px`);
      }
    }

    if (this.layoutService.hasOverlaySubmenu() && this.layoutService.isDesktop()) {
      this.layoutService.layoutState.update((val) => ({
        ...val,
        activePath: null,
        menuHoverActive: false,
      }));
    }
  }

  private setupIntersectionObserver() {
    const menuContainer = this.menuContainer();
    if (!menuContainer?.nativeElement) return;

    if (this.observer) {
      this.observer.disconnect();
    }

    const activeMenuItem = menuContainer.nativeElement.querySelector('.layout-root-menuitem.active-menuitem');
    if (!activeMenuItem) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            this.layoutService.isDesktop() &&
            !entry.isIntersecting &&
            this.layoutService.hasOverlaySubmenu() &&
            this.layoutService.layoutState().activePath
          ) {
            this.layoutService.layoutState.update((val) => ({
              ...val,
              activePath: null,
            }));
          }
        });
      },
      {
        root: menuContainer.nativeElement,
        threshold: 0,
      },
    );

    this.observer.observe(activeMenuItem);
  }

  private unbindObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
