import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AUTH_CONFIG, AuthService } from '@otwld/ng-auth/core';

/**
 * Renders the email verification page for one-time password confirmation.
 *
 * @example
 * ```ts
 * {
 *   path: 'verification',
 *   loadComponent: () => import('./pages/verification/verification').then((m) => m.VerificationPage),
 * }
 * ```
 */
@Component({
  selector: 'auth-verification',
  standalone: true,
  imports: [FormsModule, RouterModule, ButtonModule, InputTextModule],
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
          <div class="text-surface-900 dark:text-surface-0 text-xl font-bold mb-2">Verification</div>
          <span class="text-surface-600 dark:text-surface-200 font-medium">Enter the 6-character code sent to your email</span>
        </div>

        @if (error()) {
          <p class="text-red-500 text-sm mb-4">{{ error() }}</p>
        }

        <div class="flex justify-center mb-6">
          <input pInputText [(ngModel)]="otp" maxlength="6" placeholder="------" class="text-center text-2xl tracking-widest w-48" style="letter-spacing:0.5em" />
        </div>

        <div class="flex gap-2">
          <button pButton type="button" class="flex-1" outlined (click)="resend()" [loading]="resending()">Resend</button>
          <button pButton type="button" class="flex-1" (click)="verify()" [loading]="loading()">Verify</button>
        </div>
      </div>
    </div>
  `,
})
export class VerificationPage {
  /**
   * Auth API service used to verify and resend email verification codes.
   */
  private readonly authService = inject(AuthService);

  /**
   * Angular router used to navigate after successful verification.
   */
  private readonly router = inject(Router);

  /**
   * Auth package configuration used for post-verification navigation.
   */
  private readonly config = inject(AUTH_CONFIG);

  /**
   * One-time password entered by the user.
   *
   * Expected values are strings from zero to six characters, with six characters expected for submission.
   */
  protected otp = '';

  /**
   * Submission state for the verify button.
   *
   * Expected values are `true` while verification is in progress and `false` otherwise.
   */
  protected readonly loading = signal(false);

  /**
   * Submission state for the resend button.
   *
   * Expected values are `true` while the resend request is in progress and `false` otherwise.
   */
  protected readonly resending = signal(false);

  /**
   * User-facing verification error message.
   *
   * Expected values are a non-empty message string when verification fails or `null` when no error is shown.
   */
  protected readonly error = signal<string | null>(null);

  /**
   * Submits the entered one-time password and navigates after successful verification.
   *
   * @returns Nothing.
   *
   * @example
   * ```html
   * <button pButton type="button" label="Verify" (click)="verify()"></button>
   * ```
   */
  protected verify(): void {
    if (!this.otp) return;
    this.loading.set(true);
    this.authService.verifyEmail(this.otp).subscribe({
      next: () => this.router.navigateByUrl(this.config.afterLoginRoute ?? '/dashboard'),
      error: (err) => { this.error.set(err?.error?.message ?? 'Verification failed'); this.loading.set(false); },
    });
  }

  /**
   * Requests a new verification code for the current user.
   *
   * @returns Nothing.
   *
   * @example
   * ```html
   * <button pButton type="button" label="Resend" (click)="resend()"></button>
   * ```
   */
  protected resend(): void {
    this.resending.set(true);
    this.authService.resendVerification().subscribe({
      next: () => this.resending.set(false),
      error: () => this.resending.set(false),
    });
  }
}
