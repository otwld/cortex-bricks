import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { AUTH_CONFIG, AuthService } from '@otwld/ng-auth/core';

/**
 * Renders the login page for email/password and social-provider sign-in.
 *
 * @example
 * ```ts
 * {
 *   path: 'login',
 *   loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage),
 * }
 * ```
 */
@Component({
  selector: 'auth-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, ButtonModule, CheckboxModule, IconFieldModule, InputIconModule, InputTextModule],
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
          <div class="text-surface-900 dark:text-surface-0 text-xl font-bold mb-2">Log in</div>
          <span class="text-surface-600 dark:text-surface-200 font-medium">Please enter your details</span>
        </div>

        <div class="flex gap-2 mb-6">
          <button pButton type="button" class="flex-1" outlined (click)="authService.loginWithGoogle()">
            <span class="pi pi-google mr-2"></span> Google
          </button>
          <button pButton type="button" class="flex-1" outlined (click)="authService.loginWithGithub()">
            <span class="pi pi-github mr-2"></span> GitHub
          </button>
        </div>

        <div class="flex items-center gap-3 mb-6">
          <div class="flex-1 h-px bg-surface-200 dark:bg-surface-700"></div>
          <span class="text-surface-400 text-sm">or continue with email</span>
          <div class="flex-1 h-px bg-surface-200 dark:bg-surface-700"></div>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col">
          @if (error()) {
            <p class="text-red-500 text-sm mb-4">{{ error() }}</p>
          }

          <p-iconfield class="w-full mb-6">
            <p-inputicon class="pi pi-envelope" />
            <input formControlName="email" type="email" pInputText class="w-full" placeholder="Email" />
          </p-iconfield>

          <p-iconfield class="w-full mb-6">
            <p-inputicon class="pi pi-lock" />
            <input formControlName="password" type="password" pInputText class="w-full" placeholder="Password" />
          </p-iconfield>

          <div class="mb-6 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <p-checkbox formControlName="rememberMe" [binary]="true" inputId="rememberMe" />
              <label for="rememberMe" class="text-surface-900 dark:text-surface-0 font-medium">Remember Me</label>
            </div>
            <a class="text-surface-600 dark:text-surface-200 cursor-pointer hover:text-primary" routerLink="/auth/forgot-password">Reset password</a>
          </div>

          <button pButton type="submit" class="w-full" [loading]="loading()">Log In</button>

          @if (config.devLoginEnabled) {
            <button
              pButton
              type="button"
              severity="secondary"
              outlined
              class="w-full mt-3"
              [loading]="loading()"
              (click)="submitDevelopmentLogin()"
            >
              Developer Login
            </button>
          }

          <span class="mt-4 text-center text-surface-600 dark:text-surface-200 text-sm">
            Don't have an account?
            <a class="font-semibold cursor-pointer text-surface-900 dark:text-surface-0 hover:text-primary" routerLink="/auth/register">Register</a>
          </span>
        </form>
      </div>
    </div>
  `,
})
export class LoginPage {
  /**
   * Auth API service exposed to the template for credential and provider login actions.
   */
  protected readonly authService = inject(AuthService);

  /**
   * Angular router used to navigate after successful credential login.
   */
  private readonly router = inject(Router);

  /**
   * Auth package configuration used for post-login navigation.
   */
  protected readonly config = inject(AUTH_CONFIG);

  /**
   * Submission state for the login button.
   *
   * Expected values are `true` while login is in progress and `false` otherwise.
   */
  protected readonly loading = signal(false);

  /**
   * User-facing login error message.
   *
   * Expected values are a non-empty message string when login fails or `null` when no error is shown.
   */
  protected readonly error = signal<string | null>(null);

  /**
   * Email/password login form.
   *
   * The `email` control accepts a valid email address, `password` accepts a non-empty string, and
   * `rememberMe` is a boolean toggle.
   */
  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    rememberMe: new FormControl(false, { nonNullable: true }),
  });

  /**
   * Submits the login form and navigates to the configured application route on success.
   *
   * @returns Nothing.
   *
   * @example
   * ```html
   * <form [formGroup]="form" (ngSubmit)="submit()">
   *   <button pButton type="submit" label="Log In"></button>
   * </form>
   * ```
   */
  protected submit(): void {
    this.loginWith((email, password) => this.authService.login(email, password));
  }

  /**
   * Submits the login form to the development-only backend login endpoint.
   *
   * @returns Nothing.
   *
   * @example
   * ```html
   * <button pButton type="button" label="Developer Login" (click)="submitDevelopmentLogin()"></button>
   * ```
   */
  protected submitDevelopmentLogin(): void {
    this.loginWith((email, password) => this.authService.devLogin(email, password));
  }

  /**
   * Executes a credential login operation and applies shared loading, error, and navigation behavior.
   *
   * @param operation - Login operation that should receive the form email and password.
   * @returns Nothing.
   */
  private loginWith(operation: (email: string, password: string) => ReturnType<AuthService['login']>): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();
    operation(email, password).subscribe({
      next: () => this.router.navigateByUrl(this.config.afterLoginRoute ?? '/dashboard'),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Login failed');
        this.loading.set(false);
      },
    });
  }
}
