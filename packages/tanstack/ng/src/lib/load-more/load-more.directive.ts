import { Directive, input } from '@angular/core';

/**
 * Minimal infinite-query contract required by {@link LoadMoreDirective}.
 *
 * The directive only depends on page-fetch actions and the current fetching state,
 * which keeps stories and consuming code from having to mock the entire TanStack
 * query result surface.
 */
export interface LoadMoreQuery {
  fetchNextPage(options: { cancelRefetch: boolean }): Promise<unknown> | unknown;
  fetchPreviousPage(options: { cancelRefetch: boolean }): Promise<unknown> | unknown;
  isFetching(): boolean;
}

/**
 * Directive that turns an element into a "Load more" trigger
 * for a TanStack Infinite Query.
 *
 * It handles both next-page and previous-page fetching,
 * adds fetch-state classes automatically,
 * and unifies the interaction model (click + Enter).
 */
@Directive({
  selector: '[tanstackLoadMore]',
  standalone: true,
  host: {
    '(click)': 'triggerLoad()',
    '(keyup.enter)': 'triggerLoad()',

    // Apply visual state based on loading status
    '[class.is-loading]': 'query().isFetching()',
    '[class.is-disabled]': 'query().isFetching()',
  },
})
/** Binds a host element to TanStack infinite-query pagination actions. */
export class LoadMoreDirective<T extends LoadMoreQuery> {
  /**
   * The infinite query instance controlling pagination.
   *
   * Must be provided via input binding:
   *   [query]="myInfiniteQuery"
   */
  public readonly query = input.required<T>();

  /**
   * Defines which direction to fetch when triggered.
   * - "next": fetchNextPage()
   * - "previous": fetchPreviousPage()
   *
   * Defaults to "next".
   */
  public readonly direction = input<'previous' | 'next'>('next');

  /**
   * Trigger the appropriate fetch action based on `direction`.
   */
  triggerLoad() {
    const q = this.query();

    return this.direction() === 'next'
      ? q.fetchNextPage({ cancelRefetch: false })
      : q.fetchPreviousPage({ cancelRefetch: false });
  }
}
