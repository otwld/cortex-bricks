import { HttpErrorResponse } from '@angular/common/http';
import { Directive, computed, input } from '@angular/core';
import type { CreateMutationResult } from '@tanstack/angular-query-experimental';

type Predicate<TVars> = (variables: TVars) => boolean;

/**
 * Angular directive that binds a TanStack mutation to a host element
 * (typically a button) and provides:
 *
 * - Automatic triggering of `mutation.mutate(variables)` on click
 * - Pending-state UI affordances (CSS classes + `aria-busy`)
 * - Optional scoping of the pending state to the “owner” of the mutation
 *   (useful for list / row-level actions)
 *
 * ---
 *
 * ## Responsibilities
 *
 * - Observes the provided `CreateMutationResult`
 * - Computes whether the mutation is currently pending *for this element*
 * - Disables interaction while pending to prevent double submissions
 *
 * ---
 *
 * ## Accessibility
 *
 * While the mutation is pending, the directive:
 * - Sets `aria-busy="true"` on the host element
 * - Applies a `pointer-events-none` class to prevent user interaction
 *
 * This makes the loading state perceivable both visually and for assistive
 * technologies.
 *
 * ---
 *
 * ## Usage
 *
 * ```html
 * <button
 *   [tanstackMutation]="saveUserMutation"
 *   [mutationVariables]="{ userId: user.id }"
 *   [mutationIsMe]="(v) => v.userId === user.id"
 * >
 *   Save
 * </button>
 * ```
 *
 * ---
 *
 * ## Notes
 *
 * - The directive is intentionally **stateless** and derives all behavior
 *   from signals exposed by TanStack Query.
 * - Mutation variables may be `undefined` before or after execution; this
 *   is handled defensively.
 * - Error rendering semantics remain owned by the consuming app.
 *
 * ---
 *
 * @typeParam TVariables - Type of the variables passed to `mutation.mutate`
 * @typeParam TData - Type of the successful mutation result
 * @typeParam TError - Type of the mutation error
 */
@Directive({
  selector: '[tanstackMutation]',
  standalone: true,
  host: {
    // UX affordances while pending
    '[class.fade-in]': 'isPendingForMe()',
    '[class.pointer-events-none]': 'isPendingForMe()',
    '[attr.aria-busy]': 'isPendingForMe() ? "true" : null',
    '[attr.data-mutation-pending]': 'isPendingForMe() ? "" : null',

    // Trigger the mutation
    '(click)': 'trigger()',
  },
})
/** Connects a host element to a TanStack mutation with pending-state UX. */
export class MutationDirective<TVariables, TData = unknown, TError = unknown> {
  /**
   * Mutation to trigger & observe.
   *
   * Usage:
   * ```html
   * <button [tanstackMutation]="saveMutation" [mutationVariables]="{ userId: user.id }">Save</button>
   * ```
   */
  readonly mutation = input.required<CreateMutationResult<TData, TError, TVariables>>({
    alias: 'tanstackMutation',
  });

  /**
   * Variables passed to `mutation.mutate(vars)`.
   *
   * Note: this directive does **not** consider "falsy" objects as missing (only `null`/`undefined`).
   */
  readonly mutationVariables = input.required<TVariables | undefined>();

  /**
   * Optional predicate to scope pending styling to "my" mutation instance (e.g. row-level save buttons).
   * If omitted, any pending state applies.
   *
   * Example:
   * ```html
   * <button
   *   [tanstackMutation]="saveUserMutation"
   *   [mutationVariables]="{ userId: user.id }"
   *   [mutationIsMe]="(v) => v.userId === user.id"
   * >
   *   Save
   * </button>
   * ```
   */
  readonly mutationIsMe = input<Predicate<TVariables> | null>(null);

  /**
   * True when:
   * - mutation is pending
   * - AND either no predicate is provided, or predicate matches the mutation's current variables
   */
  readonly isPendingForMe = computed(() => {
    const mutation = this.mutation();

    if (!mutation.isPending()) return false;

    const predicate = this.mutationIsMe();
    if (!predicate) return true;

    // TanStack mutation variables can be undefined before/after execution.
    const vars = mutation.variables();
    return vars !== undefined && predicate(vars);
  });

  /**
   * Triggers the underlying mutation if variables are present.
   *
   * - Does nothing when variables are `null`/`undefined`
   * - Does nothing when the mutation is already pending for this element (prevents double-submits)
   */
  trigger(): void {
    if (this.isPendingForMe()) return;

    const vars = this.mutationVariables();
    if (vars == null) return;

    this.mutation().mutate(vars);
  }
}

/**
 * Extracts a user-readable mutation error message from Angular HTTP errors,
 * Error instances, strings, or plain thrown objects.
 */
export function extractMutationErrorMessage(error: unknown): string {
  // Prefer Angular HTTP errors when available.
  if (error instanceof HttpErrorResponse) {
    const serverMessage = extractServerMessage(error.error);
    return serverMessage ?? error.message ?? 'HTTP error';
  }

  if (error instanceof Error) return error.message;

  // TanStack / fetch libraries sometimes throw plain objects/strings.
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') return maybeMessage;
  }

  return 'Unhandled error';
}

function extractServerMessage(payload: unknown): string | null {
  // Common server shapes: { message: string } or { message: string[] } (class-validator)
  if (!payload || typeof payload !== 'object') return null;

  const message = (payload as { message?: unknown }).message;

  if (typeof message === 'string') return message;
  if (Array.isArray(message) && message.every((x) => typeof x === 'string')) return message.join('\n');

  return null;
}
