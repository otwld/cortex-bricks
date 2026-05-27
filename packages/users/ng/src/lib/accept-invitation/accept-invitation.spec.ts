import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '@otwld/ng-users/core';
import { UserInvitationStatus } from '@otwld/ts-users';
import { of } from 'rxjs';
import { AcceptInvitationPage } from './accept-invitation';

describe(AcceptInvitationPage.name, () => {
  let fixture: ComponentFixture<AcceptInvitationPage>;
  const usersService = {
    getInvitation: vi.fn().mockReturnValue(
      of({
        invitation: {
          email: 'ada@example.com',
          displayName: 'Ada Lovelace',
          status: UserInvitationStatus.Pending,
          expiresAt: '2026-05-14T00:00:00.000Z',
          availableProviders: ['credentials', 'google', 'github'],
        },
      }),
    ),
    acceptCredentials: vi.fn().mockReturnValue(of({ accepted: true, user: { id: 'profile-1' } })),
    startOAuth: vi.fn(),
  };

  beforeEach(async () => {
    usersService.getInvitation.mockClear();
    usersService.acceptCredentials.mockClear();
    usersService.startOAuth.mockClear();

    await TestBed.configureTestingModule({
      imports: [AcceptInvitationPage],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['token', 'raw-token']]), queryParamMap: new Map() } } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AcceptInvitationPage);
    fixture.detectChanges();
  });

  it('loads invitation details', () => {
    expect(usersService.getInvitation).toHaveBeenCalledWith('raw-token');
    expect(fixture.nativeElement.textContent).toContain('ada@example.com');
  });

  it('submits local credentials', () => {
    const component = fixture.componentInstance;
    component.form.setValue({ username: 'ada', password: 'secret123' });

    component.acceptCredentials();

    expect(usersService.acceptCredentials).toHaveBeenCalledWith('raw-token', { username: 'ada', password: 'secret123' });
  });

  it('starts social setup through the selected provider', () => {
    fixture.componentInstance.startGoogle();

    expect(usersService.startOAuth).toHaveBeenCalledWith('raw-token', 'google');
  });
});
