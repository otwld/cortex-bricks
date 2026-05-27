import { Component, inject, ViewEncapsulation } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';

import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

/**
 * Displays a breadcrumb navigation trail.
 *
 * This component shows users where they are in the application
 * and allows them to easily navigate back to previous pages.
 *
 * Example:
 * `<nav dashboard-breadcrumb></nav>`
 *
 * Requirements:
 * Each route should define a `breadcrumb` value in its `data`
 * for it to appear in the trail.
 */
@Component({
  selector: 'nav[dashboard-breadcrumb], dashboard-breadcrumb',
  imports: [BreadcrumbModule],
  styleUrl: './dashboard-breadcrumb.scss',
  encapsulation: ViewEncapsulation.None,
  template: `<p-breadcrumb [model]="breadcrumbs()" styleClass="layout-breadcrumb bg-transparent!">
    <ng-template #separator>/</ng-template>
  </p-breadcrumb>`,
})
export class DashboardBreadcrumb {
  private readonly router = inject(Router);

  /**
   * Breadcrumbs shown at the top of the dashboard.
   *
   * They help users understand where they are in the app and let them
   * navigate back to parent pages.
   */
  protected readonly breadcrumbs = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.routerState.snapshot.root),
      map((root) => this.buildBreadcrumbModel(root)),
    ),
    { initialValue: this.buildBreadcrumbModel(this.router.routerState.snapshot.root) },
  );

  /**
   * Creates the breadcrumb path for the current page.
   *
   * Each route can define a `breadcrumb` value in its route data.
   * Duplicate labels are skipped so the UI stays clean.
   */
  private buildBreadcrumbModel(route: ActivatedRouteSnapshot): MenuItem[] {
    const breadcrumbs = this.buildBreadcrumbs(route);

    return breadcrumbs.map((item, index) => (index === breadcrumbs.length - 1 ? { label: item.label } : item));
  }

  private buildBreadcrumbs(route: ActivatedRouteSnapshot, parentUrl: string[] = [], parentBreadcrumb?: string): MenuItem[] {
    const routeUrl = [...parentUrl, ...route.url.map((segment) => segment.path)];

    const breadcrumb = route.data['breadcrumb'] as string | undefined;

    const current: MenuItem[] = breadcrumb && breadcrumb !== parentBreadcrumb ? [{ label: breadcrumb, routerLink: this.toRouterLink(routeUrl) }] : [];

    return [...current, ...route.children.flatMap((child) => this.buildBreadcrumbs(child, routeUrl, breadcrumb ?? parentBreadcrumb))];
  }

  private toRouterLink(routeUrl: string[]): string {
    return `/${routeUrl.join('/')}`;
  }
}
