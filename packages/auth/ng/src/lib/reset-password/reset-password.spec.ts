import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@otwld/ng-auth/core';
import { of } from 'rxjs';
import { ResetPasswordPage } from './reset-password';

describe(ResetPasswordPage.name, () => {
  let fixture: ComponentFixture<ResetPasswordPage>;
  const authService = {
    resetPassword: vi.fn().mockReturnValue(of(undefined)),
  };
  const router = {
    navigateByUrl: vi.fn(),
  };
  const meta = {
    updateTag: vi.fn(),
  };

  beforeEach(async () => {
    authService.resetPassword.mockClear();
    router.navigateByUrl.mockClear();
    meta.updateTag.mockClear();

    await TestBed.configureTestingModule({
      imports: [ResetPasswordPage],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: Meta, useValue: meta },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: new Map([['token', 'reset-token']]) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordPage);
    fixture.detectChanges();
  });

  it('sets no-referrer policy for reset token pages', () => {
    expect(meta.updateTag).toHaveBeenCalledWith({ name: 'referrer', content: 'no-referrer' });
  });

  it('requires matching passwords before reset', () => {
    const component = fixture.componentInstance;
    component.form.setValue({ password: 'new-password', confirm: 'other-password' });

    component.submit();

    expect(component.error()).toBe('Passwords do not match');
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('resets the password and returns to login without creating a session', () => {
    const component = fixture.componentInstance;
    component.form.setValue({ password: 'new-password', confirm: 'new-password' });

    component.submit();

    expect(authService.resetPassword).toHaveBeenCalledWith('reset-token', 'new-password');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
  });
});
