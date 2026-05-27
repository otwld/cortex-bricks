import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';

/**
 * Displays a `403` authorization failure page with browser history navigation.
 *
 * @example
 * ```ts
 * {
 *   path: 'access',
 *   loadComponent: () => import('./pages/access-denied/access-denied').then((m) => m.AccessDeniedPage),
 * }
 * ```
 */
@Component({
  selector: 'auth-access-denied',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-surface-50 dark:bg-surface-950 px-8">
      <div class="text-center">
        <div class="text-primary font-bold text-8xl mb-4">403</div>
        <div class="text-surface-900 dark:text-surface-0 text-3xl font-bold mb-4">Access Denied</div>
        <p class="text-surface-600 dark:text-surface-200 mb-8">You don't have permission to access this page.</p>
        <button pButton (click)="back()">Go Back</button>
      </div>
    </div>
  `,
})
export class AccessDeniedPage {
  /**
   * Browser location service used to return the user to the previous history entry.
   */
  private readonly location = inject(Location);

  /**
   * Navigates to the previous browser history entry.
   *
   * @returns Nothing.
   *
   * @example
   * ```html
   * <button pButton label="Go Back" (click)="back()"></button>
   * ```
   */
  protected back(): void { this.location.back(); }
}
