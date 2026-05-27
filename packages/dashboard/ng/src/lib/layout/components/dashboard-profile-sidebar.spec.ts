import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '@otwld/ng-auth/core';
import { DashboardLayoutService } from '@otwld/ng-dashboard/core';
import { DashboardProfileSidebar } from './dashboard-profile-sidebar';

describe(DashboardProfileSidebar.name, () => {
  it('logs out and hides the profile sidebar when sign out is clicked', async () => {
    const logout = vi.fn(() => of(undefined));
    const layoutService = {
      layoutState: Object.assign(
        vi.fn(() => ({ profileSidebarVisible: true })),
        {
          update: vi.fn(),
        },
      ),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardProfileSidebar],
      providers: [
        { provide: AuthService, useValue: { logout } },
        { provide: DashboardLayoutService, useValue: layoutService },
      ],
    })
      .overrideComponent(DashboardProfileSidebar, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA], template: `<button type="button" (click)="signOut()">Sign Out</button>` },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(DashboardProfileSidebar);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(logout).toHaveBeenCalledOnce();
    expect(layoutService.layoutState.update).toHaveBeenCalledWith(expect.any(Function));
  });
});
