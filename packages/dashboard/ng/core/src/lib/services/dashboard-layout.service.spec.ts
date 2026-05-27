import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DarkModeService, provideDarkMode } from '@otwld/ng-cdk';
import { DashboardLayoutService } from './dashboard-layout.service';
import { provideDashboardLayoutConfig } from '../tokens/dashboard-layout-config-token';
import { provideDashboardLayoutState } from '../tokens/dashboard-layout-state-token';

describe('DashboardLayoutService', () => {
  function configure(platformId = 'browser') {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideDarkMode({ initialPreference: 'light', persistence: false }),
        provideDashboardLayoutConfig(),
        provideDashboardLayoutState(),
        { provide: PLATFORM_ID, useValue: platformId },
        DashboardLayoutService,
      ],
    });
  }

  beforeEach(() => {
    configure();
  });

  afterEach(() => {
    document.documentElement.classList.remove('app-dark');
  });

  it('exposes dark theme state from ng-cdk dark mode', () => {
    const service = TestBed.inject(DashboardLayoutService);
    const darkMode = TestBed.inject(DarkModeService);

    expect(service.isDarkTheme()).toBe(false);

    darkMode.setDarkMode(true);

    expect(service.isDarkTheme()).toBe(true);
  });

  it('returns false for isDesktop when running without a browser window', () => {
    TestBed.resetTestingModule();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });
    configure('server');

    const service = TestBed.inject(DashboardLayoutService);

    expect(service.isDesktop()).toBe(false);
  });
});
