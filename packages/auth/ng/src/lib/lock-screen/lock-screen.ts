import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PasswordModule } from 'primeng/password';
import { AUTH_CONFIG, AuthService, AuthStateService } from '@otwld/ng-auth/core';
/**
 * Renders the lock screen and re-authenticates the current user with a password.
 *
 * @example
 * ```ts
 * {
 *   path: 'lockscreen',
 *   loadComponent: () => import('./pages/lock-screen/lock-screen').then((m) => m.LockScreenPage),
 * }
 * ```
 */
@Component({
  selector: 'auth-lock-screen',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, ButtonModule, IconFieldModule, InputIconModule, PasswordModule],
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 800" class="fixed left-0 top-0 min-h-screen min-w-screen" preserveAspectRatio="none">
      <rect fill="var(--p-primary-500)" width="1600" height="800" />
      <path fill="var(--p-primary-400)" d="M478.4 581c3.2 0.8 6.4 1.7 9.5 2.5c196.2 52.5 388.7 133.5 593.5 176.6c174.2 36.6 349.5 29.2 518.6-10.2V0H0v574.9c52.3-17.6 106.5-27.7 161.1-30.9C268.4 537.4 375.7 554.2 478.4 581z"/>
      <path fill="var(--p-primary-300)" d="M181.8 259.4c98.2 6 191.9 35.2 281.3 72.1c2.8 1.1 5.5 2.3 8.3 3.4c171 71.6 342.7 158.5 531.3 207.7c198.8 51.8 403.4 40.8 597.3-14.8V0H0v283.2C59 263.6 120.6 255.7 181.8 259.4z"/>
      <path fill="var(--p-primary-200)" d="M454.9 86.3C600.7 177 751.6 269.3 924.1 325c208.6 67.4 431.3 60.8 637.9-5.3c12.8-4.1 25.4-8.4 38.1-12.9V0H288.1c56 21.3 108.7 50.6 159.7 82C450.2 83.4 452.5 84.9 454.9 86.3z"/>
      <path fill="var(--p-primary-100)" d="M1397.5 154.8c47.2-10.6 93.6-25.3 138.6-43.8c21.7-8.9 43-18.8 63.9-29.5V0H643.4c62.9 41.7 129.7 78.2 202.1 107.4C1020.4 178.1 1214.2 196.1 1397.5 154.8z"/>
    </svg>

    <div class="px-8 min-h-screen flex justify-center items-center">
      <div class="border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded py-16 px-6 md:px-16 z-10 w-full max-w-md">
        <div class="mb-6 text-center">
          @if (avatar()) {
            <img [src]="avatar()" class="w-16 h-16 rounded-full mx-auto mb-3 object-cover" alt="avatar" />
          } @else {
            <div class="w-16 h-16 rounded-full mx-auto mb-3 bg-surface-200 dark:bg-surface-700 flex items-center justify-center">
              <i class="pi pi-user text-2xl text-surface-500"></i>
            </div>
          }
          <div class="text-surface-900 dark:text-surface-0 text-xl font-bold mb-1">{{ displayName() }}</div>
          <span class="text-surface-600 dark:text-surface-200 font-medium">Enter your password to continue</span>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col">
          @if (error()) {
            <p class="text-red-500 text-sm mb-4">{{ error() }}</p>
          }

          <p-iconfield class="w-full mb-6">
            <p-inputicon class="pi pi-lock z-20" />
            <p-password formControlName="password" placeholder="Password" styleClass="w-full" [inputStyle]="{ paddingLeft: '2.5rem' }" inputStyleClass="w-full" [toggleMask]="true" [feedback]="false" />
          </p-iconfield>

          <button pButton type="submit" class="w-full" [loading]="loading()">Unlock</button>
        </form>
      </div>
    </div>
  `,
})
export class LockScreenPage {
  /**
   * Auth API service used to validate the submitted password.
   */
  private readonly authService = inject(AuthService);

  /**
   * Auth state service used to read the current user's email and profile display fields.
   */
  private readonly authState = inject(AuthStateService);

  /**
   * Angular router used to continue to the configured post-login route.
   */
  private readonly router = inject(Router);

  /**
   * Auth package configuration used for post-login navigation.
   */
  private readonly config = inject(AUTH_CONFIG);

  /**
   * Display name derived from the current authenticated user.
   */
  protected readonly displayName = this.authState.displayName;

  /**
   * Avatar URL shown on the lock screen.
   *
   * Expected values are a URL string for a user avatar or `null` when no avatar is available.
   */
  protected readonly avatar = signal(this.authState.user()?.avatar ?? null);

  /**
   * Submission state for the unlock button.
   *
   * Expected values are `true` while the password check is in progress and `false` otherwise.
   */
  protected readonly loading = signal(false);

  /**
   * User-facing unlock error message.
   *
   * Expected values are a non-empty message string when unlock fails or `null` when no error is shown.
   */
  protected readonly error = signal<string | null>(null);

  /**
   * Lock screen password form.
   *
   * The `password` control accepts a non-empty password string.
   */
  protected readonly form = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  /**
   * Submits the current user's email and entered password to unlock the session.
   *
   * @returns Nothing.
   *
   * @example
   * ```html
   * <form [formGroup]="form" (ngSubmit)="submit()">
   *   <button pButton type="submit" label="Unlock"></button>
   * </form>
   * ```
   */
  protected submit(): void {
    const email = this.authState.user()?.email;
    if (!email || this.form.invalid) return;

    this.loading.set(true);
    const { password } = this.form.getRawValue();
    this.authService.login(email, password).subscribe({
      next: () => this.router.navigateByUrl(this.config.afterLoginRoute ?? '/dashboard'),
      error: (err) => { this.error.set(err?.error?.message ?? 'Incorrect password'); this.loading.set(false); },
    });
  }
}
