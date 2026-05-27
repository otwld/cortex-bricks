import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { UsersService } from '@otwld/ng-users/core';
import { UserAccountStatus } from '@otwld/ts-users';
import { of, throwError } from 'rxjs';
import { FormStateService } from '../../form-state.service';
import { AccountStatus } from './account-status';

describe(AccountStatus.name, () => {
  let fixture: ComponentFixture<AccountStatus>;
  const usersService = {
    create: vi.fn().mockReturnValue(
      of({
        user: { id: 'profile-1', displayName: 'Ada Lovelace', email: 'ada@example.com' },
        invitation: { link: '/accept-invitation/raw-token', expiresAt: '2026-05-14T00:00:00.000Z', deliveryStatus: 'not-requested' },
        invitationSent: false,
      }),
    ),
  };
  const router = {
    navigate: vi.fn(),
  };

  beforeEach(async () => {
    usersService.create.mockClear();
    router.navigate.mockClear();

    await TestBed.configureTestingModule({
      imports: [AccountStatus],
      providers: [
        FormStateService,
        { provide: UsersService, useValue: usersService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    const formState = TestBed.inject(FormStateService);
    formState.formState.update((state) => ({
      ...state,
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      displayName: 'Ada Lovelace',
      department: 'Engineering',
      accountStatus: UserAccountStatus.Active,
      roles: [{ name: 'admin', permissions: ['manage:User'] }],
      permissions: ['read:Dashboard'],
      sendInvitation: true,
    }));

    fixture = TestBed.createComponent(AccountStatus);
    fixture.detectChanges();
  });

  it('submits the wizard as a create-user request', () => {
    fixture.componentInstance.save();

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ada@example.com',
        displayName: 'Ada Lovelace',
        sendInvitation: true,
        roles: [{ name: 'admin', permissions: ['manage:User'] }],
      }),
    );
    fixture.detectChanges();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('User created');
    expect(fixture.nativeElement.querySelector('input[readonly]').value).toBe('/accept-invitation/raw-token');
  });

  it('shows duplicate email errors without navigating', () => {
    usersService.create.mockReturnValueOnce(throwError(() => ({ status: 409 })));

    fixture.componentInstance.save();

    expect((fixture.componentInstance as unknown as { error: () => string | null }).error()).toBe('A user with this email already exists.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('requires email before submitting', () => {
    TestBed.inject(FormStateService).updateField('email', '');

    fixture.componentInstance.save();

    expect((fixture.componentInstance as unknown as { error: () => string | null }).error()).toBe('Email is required to create a user.');
    expect(usersService.create).not.toHaveBeenCalled();
  });
});
