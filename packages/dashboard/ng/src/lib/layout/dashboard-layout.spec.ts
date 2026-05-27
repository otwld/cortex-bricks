import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideDarkMode } from '@otwld/ng-cdk';
import { DASHBOARD_LAYOUT_STATE, provideDashboardLayoutConfig, provideDashboardLayoutState } from '@otwld/ng-dashboard/core';
import { DashboardLayout } from './dashboard-layout';

describe(DashboardLayout.name, () => {
  beforeEach(() => {
    document.body.classList.remove('blocked-scroll');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideDarkMode({ initialPreference: 'light', persistence: false }),
        provideDashboardLayoutConfig(),
        provideDashboardLayoutState(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    TestBed.overrideComponent(DashboardLayout, {
      set: {
        imports: [],
        template: '',
      },
    });
  });

  afterEach(() => {
    document.body.classList.remove('blocked-scroll');
  });

  it('updates body scroll lock when mobile menu state changes', async () => {
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(DashboardLayout);
    const layoutState = TestBed.inject(DASHBOARD_LAYOUT_STATE);

    fixture.detectChanges();
    await fixture.whenStable();
    layoutState.update((state) => ({ ...state, mobileMenuActive: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.body.classList.contains('blocked-scroll')).toBe(true);

    layoutState.update((state) => ({ ...state, mobileMenuActive: false }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.body.classList.contains('blocked-scroll')).toBe(false);
  });
});
