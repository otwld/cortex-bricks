import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '@otwld/ng-auth/core';

/**
 * Renders the password reset request page.
 *
 * @example
 * ```ts
 * {
 *   path: 'forgot-password',
 *   loadComponent: () => import('./pages/forgot-password/forgot-password').then((m) => m.ForgotPasswordPage),
 * }
 * ```
 */
@Component({
  selector: 'auth-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, ButtonModule, IconFieldModule, InputIconModule, InputTextModule],
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
        <div class="mb-6">
          <div class="text-surface-900 dark:text-surface-0 text-xl font-bold mb-2">Forgot Password</div>
          <span class="text-surface-600 dark:text-surface-200 font-medium">Enter your email to reset your password</span>
        </div>

        @if (sent()) {
          <p class="text-green-600 text-sm mb-4">If an account exists, a reset link has been sent to your email.</p>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col">
            <p-iconfield class="w-full mb-6">
              <p-inputicon class="pi pi-envelope" />
              <input formControlName="email" type="email" pInputText class="w-full" placeholder="Email" />
            </p-iconfield>

            <div class="flex gap-2">
              <button pButton type="button" class="flex-1" outlined routerLink="/auth/login">Cancel</button>
              <button pButton type="submit" class="flex-1" [loading]="loading()">Submit</button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
})
export class ForgotPasswordPage {
  /**
   * Auth API service used to request the password reset email.
   */
  private readonly authService = inject(AuthService);

  /**
   * Submission state for the reset request button.
   *
   * Expected values are `true` while the request is in progress and `false` otherwise.
   */
  protected readonly loading = signal(false);

  /**
   * Completion state for the request flow.
   *
   * Expected values are `true` after the backend responds and `false` before submission.
   */
  protected readonly sent = signal(false);

  /**
   * Password reset request form.
   *
   * The `email` control accepts a valid email address string and rejects empty or invalid email values.
   */
  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  /**
   * Submits the reset request when the form contains a valid email address.
   *
   * @returns Nothing.
   *
   * @example
   * ```html
   * <form [formGroup]="form" (ngSubmit)="submit()">
   *   <button pButton type="submit" [loading]="loading()"></button>
   * </form>
   * ```
   */
  protected submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    const { email } = this.form.getRawValue();

    this.authService.forgotPassword(email).subscribe({
      next: () => { this.sent.set(true); this.loading.set(false); },
      error: () => { this.sent.set(true); this.loading.set(false); },
    });
  }
}
