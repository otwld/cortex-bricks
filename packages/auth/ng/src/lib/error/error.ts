import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ButtonModule } from 'primeng/button';

/**
 * Displays a generic `500` error page with browser history navigation.
 *
 * @example
 * ```ts
 * {
 *   path: 'error',
 *   loadComponent: () => import('./pages/error/error').then((m) => m.ErrorPage),
 * }
 * ```
 */
@Component({
  selector: 'auth-error',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-surface-50 dark:bg-surface-950 px-8">
      <div class="text-center">
        <div class="text-primary font-bold text-8xl mb-4">500</div>
        <div class="text-surface-900 dark:text-surface-0 text-3xl font-bold mb-4">Something went wrong</div>
        <p class="text-surface-600 dark:text-surface-200 mb-8">An unexpected error occurred. Please try again later.</p>
        <button pButton (click)="back()">Go Back</button>
      </div>
    </div>
  `,
})
export class ErrorPage {
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
