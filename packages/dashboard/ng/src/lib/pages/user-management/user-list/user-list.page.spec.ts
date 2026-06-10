import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { UsersService } from '@otwld/ng-users/core';
import { UserAccountStatus, UserInvitationStatus, UserListItem } from '@otwld/ts-users';
import { ConfirmationService } from 'primeng/api';
import { Subject, of, throwError } from 'rxjs';
import { UserListPage } from './user-list.page';

describe(UserListPage.name, () => {
  let fixture: ComponentFixture<UserListPage>;
  let list$: Subject<{ users: UserListItem[] }>;
  const usersService = {
    list: vi.fn(),
    resendInvitation: vi.fn().mockReturnValue(
      of({
        user: {},
        invitation: { link: '/accept-invitation/raw-token', expiresAt: '2026-05-14T00:00:00.000Z', deliveryStatus: 'not-requested' },
        invitationSent: false,
      }),
    ),
    delete: vi.fn().mockReturnValue(of({ user: {} })),
  };

  const user: UserListItem = {
    id: 'profile-1',
    authUserId: 'auth-1',
    email: 'ada@example.com',
    displayName: 'Ada Lovelace',
    firstName: 'Ada',
    lastName: 'Lovelace',
    avatar: undefined,
    department: 'Engineering',
    position: 'Principal Engineer',
    accountStatus: UserAccountStatus.Active,
    invitationStatus: UserInvitationStatus.Pending,
    emailVerified: false,
    roles: [{ name: 'admin', permissions: ['manage:User'] }],
    permissions: [],
    createdAt: '2026-05-07T00:00:00.000Z',
    updatedAt: '2026-05-07T00:00:00.000Z',
    lastLoginAt: undefined,
  };

  async function createComponent() {
    list$ = new Subject();
    usersService.list.mockReset();
    usersService.list.mockReturnValue(list$.asObservable());
    usersService.resendInvitation.mockClear();
    usersService.delete.mockClear();

    await TestBed.configureTestingModule({
      imports: [UserListPage],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListPage);
    fixture.detectChanges();
  }

  it('shows loading before users load', async () => {
    await createComponent();

    expect(fixture.componentInstance.loading()).toBe(true);
  });

  it('renders an empty state', async () => {
    await createComponent();

    list$.next({ users: [] });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No users found.');
  });

  it('renders loaded user rows', async () => {
    await createComponent();

    list$.next({ users: [user] });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');
    expect(fixture.nativeElement.textContent).toContain('ada@example.com');
  });

  it('distinguishes storage avatar keys from external image URLs', async () => {
    await createComponent();

    expect(fixture.componentInstance.isStorageAvatar('uploads/avatar.png')).toBe(true);
    expect(fixture.componentInstance.isStorageAvatar('https://example.com/avatar.png')).toBe(false);
    expect(fixture.componentInstance.isStorageAvatar('/assets/avatar.png')).toBe(false);
  });

  it('retries failed loads', async () => {
    await createComponent();
    usersService.list.mockReturnValueOnce(throwError(() => new Error('failed'))).mockReturnValueOnce(of({ users: [] }));

    fixture.componentInstance.loadUsers();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-testid="users-retry"]').click();

    expect(usersService.list).toHaveBeenCalledTimes(3);
  });

  it('resends invitations and reloads users', async () => {
    await createComponent();

    fixture.componentInstance.resendInvitation('profile-1');
    fixture.detectChanges();

    expect(usersService.resendInvitation).toHaveBeenCalledWith('profile-1');
    expect(usersService.list).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Invitation link ready');
    expect(fixture.nativeElement.querySelector('input[readonly]').value).toBe('/accept-invitation/raw-token');
  });

  it('deletes after confirmation accept', async () => {
    await createComponent();
    const confirmationService = fixture.debugElement.injector.get(ConfirmationService);
    vi.spyOn(confirmationService, 'confirm').mockImplementation((confirmation) => confirmation.accept?.());

    fixture.componentInstance.confirmDelete('profile-1');

    expect(usersService.delete).toHaveBeenCalledWith('profile-1');
  });
});
