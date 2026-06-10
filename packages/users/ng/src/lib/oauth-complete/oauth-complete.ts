import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UsersService } from '@otwld/ng-users/core';

/** Completes invitation acceptance after OAuth redirects back to the frontend. */
@Component({
  selector: 'usr-oauth-complete',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="min-h-screen bg-surface-50 px-6 py-10 text-surface-900 dark:bg-surface-950 dark:text-surface-0">
      <section class="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <div class="rounded-lg border border-surface-200 bg-surface-0 p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900">
          <h1 class="text-2xl font-semibold">Completing invitation</h1>

          @if (error()) {
            <p class="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
          } @else if (accepted()) {
            <p class="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Invitation accepted.</p>
            <a routerLink="/dashboard" class="mt-4 inline-flex text-sm font-medium text-primary-600">Continue to dashboard</a>
          } @else {
            <p class="mt-3 text-sm text-surface-600 dark:text-surface-300">Please wait while we finish your account setup.</p>
          }
        </div>
      </section>
    </main>
  `,
})
export class OAuthCompletePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly usersService = inject(UsersService);

  protected readonly accepted = signal(false);
  protected readonly error = signal<string | null>(null);

  /**
   * Completes invitation OAuth using the returned state query parameter.
   */
  ngOnInit(): void {
    const state = this.route.snapshot.queryParamMap.get('state');
    if (!state) {
      this.error.set('Invitation state is missing.');
      return;
    }

    this.usersService.completeOAuthState(state).subscribe({
      next: () => this.accepted.set(true),
      error: () => this.error.set('Unable to complete invitation.'),
    });
  }
}
