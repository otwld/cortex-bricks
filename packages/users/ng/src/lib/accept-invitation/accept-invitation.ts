import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserInvitationDetails, UserInvitationStatus, UserOAuthProvider } from '@otwld/ts-users';
import { UsersService } from '@otwld/ng-users/core';

/** Invitation acceptance page for local credentials or social auth. */
@Component({
  selector: 'usr-accept-invitation',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="min-h-screen bg-surface-50 px-6 py-10 text-surface-900 dark:bg-surface-950 dark:text-surface-0">
      <section class="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl flex-col justify-center">
        <div class="rounded-lg border border-surface-200 bg-surface-0 p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900">
          <div class="mb-6">
            <h1 class="text-2xl font-semibold">Accept invitation</h1>
            @if (invitation(); as invite) {
              <p class="mt-2 text-sm text-surface-600 dark:text-surface-300">{{ invite.displayName }} · {{ invite.email }}</p>
            }
          </div>

          @if (loading()) {
            <p class="text-sm text-surface-600 dark:text-surface-300">Loading invitation...</p>
          } @else if (error()) {
            <div class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</div>
          } @else if (accepted()) {
            <div class="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Invitation accepted. You can now sign in.
            </div>
            <a routerLink="/auth/login" class="mt-4 inline-flex text-sm font-medium text-primary-600">Go to login</a>
          } @else if (invitation(); as invite) {
            @if (invite.status !== invitationStatus.Pending) {
              <div class="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                This invitation is {{ invite.status }}.
              </div>
            } @else {
              <form [formGroup]="form" (ngSubmit)="acceptCredentials()" class="space-y-4">
                <label class="block">
                  <span class="mb-1 block text-sm font-medium">Username</span>
                  <input formControlName="username" class="w-full rounded-md border border-surface-300 px-3 py-2 dark:border-surface-700 dark:bg-surface-950" />
                </label>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium">Password</span>
                  <input type="password" formControlName="password" class="w-full rounded-md border border-surface-300 px-3 py-2 dark:border-surface-700 dark:bg-surface-950" />
                </label>
                <button type="submit" class="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-contrast" [disabled]="submitting()">
                  Create password
                </button>
              </form>

              <div class="my-6 h-px bg-surface-200 dark:bg-surface-800"></div>

              <div class="grid gap-3 sm:grid-cols-2">
                <button type="button" class="rounded-md border border-surface-300 px-4 py-2 text-sm font-medium dark:border-surface-700" (click)="startGoogle()">
                  Continue with Google
                </button>
                <button type="button" class="rounded-md border border-surface-300 px-4 py-2 text-sm font-medium dark:border-surface-700" (click)="startGithub()">
                  Continue with GitHub
                </button>
              </div>
            }
          }
        </div>
      </section>
    </main>
  `,
})
export class AcceptInvitationPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  private readonly usersService = inject(UsersService);
  private readonly token = this.route.snapshot.paramMap.get('token') ?? this.route.snapshot.queryParamMap.get('token') ?? '';

  /**
   * Local credential form used when accepting an invitation with username and password.
   */
  readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
  });

  protected readonly invitationStatus = UserInvitationStatus;
  protected readonly invitation = signal<UserInvitationDetails | null>(null);
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly accepted = signal(false);
  protected readonly error = signal<string | null>(null);

  /**
   * Loads invitation details and normalizes query-token URLs to the canonical route.
   */
  ngOnInit(): void {
    this.meta.updateTag({ name: 'referrer', content: 'no-referrer' });

    if (!this.token) {
      this.error.set('Invitation token is missing.');
      this.loading.set(false);
      return;
    }

    if (!this.route.snapshot.paramMap.get('token')) {
      void this.router.navigate(['/accept-invitation', this.token], { replaceUrl: true });
    }

    this.usersService.getInvitation(this.token).subscribe({
      next: ({ invitation }) => {
        this.invitation.set(invitation);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load invitation.');
        this.loading.set(false);
      },
    });
  }

  /**
   * Accepts the invitation with local credentials when the form is valid.
   */
  acceptCredentials(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.usersService.acceptCredentials(this.token, this.form.getRawValue()).subscribe({
      next: () => {
        this.accepted.set(true);
        this.submitting.set(false);
      },
      error: () => {
        this.error.set('Unable to accept invitation.');
        this.submitting.set(false);
      },
    });
  }

  /**
   * Starts Google OAuth acceptance for the invitation token.
   */
  startGoogle(): void {
    this.usersService.startOAuth(this.token, UserOAuthProvider.Google);
  }

  /**
   * Starts GitHub OAuth acceptance for the invitation token.
   */
  startGithub(): void {
    this.usersService.startOAuth(this.token, UserOAuthProvider.Github);
  }
}
