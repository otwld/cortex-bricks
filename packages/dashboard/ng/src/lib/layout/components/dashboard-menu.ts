import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';

import { MenuItem } from 'primeng/api';
import { PanelMenuModule } from 'primeng/panelmenu';
import { filter, map } from 'rxjs';

@Component({
  selector: 'dashboard-menu',
  imports: [PanelMenuModule],
  template: `<p-panelmenu [model]="menuItems()" multiple [motionOptions]="{ autoHeight: true }" />`,
  styles: `
    :host {
      --p-panelmenu-panel-border-width: 0;
      --p-panelmenu-panel-first-border-width: 0;
      --p-panelmenu-panel-last-border-width: 0;
    }

    :host ::ng-deep .p-panelmenu-item-link-active {
      font-weight: 700;
    }

    :host ::ng-deep .p-panelmenu-item-link-active .p-panelmenu-item-icon {
      color: var(--p-panelmenu-item-icon-focus-color);
    }
  `,
})
export class DashboardMenu {
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  private readonly baseMenuItems: MenuItem[] = [
    {
      label: 'Dashboards',
      icon: 'pi pi-home',
      path: '/dashboards',
      items: [
        {
          label: 'E-Commerce',
          icon: 'pi pi-fw pi-home',
          routerLink: ['/dashboard'],
          routerLinkActiveOptions: { exact: true },
        },
        {
          label: 'Banking',
          icon: 'pi pi-fw pi-image',
          routerLink: ['banking'],
        },
      ],
    },
    {
      label: 'Apps',
      icon: 'pi pi-th-large',
      path: '/apps',
      separator: true,
      items: [
        {
          label: 'CMS',
          icon: 'pi pi-fw pi-comment',
          path: '/apps/cms',
          items: [
            {
              label: 'Detail',
              icon: 'pi pi-fw pi-list',
              routerLink: ['apps/cms/detail'],
            },
            {
              label: 'Detail-2',
              icon: 'pi pi-fw pi-list',
              routerLink: ['apps/cms/detail2'],
            },
            {
              label: 'List',
              icon: 'pi pi-fw pi-image',
              routerLink: ['apps/cms/list'],
            },
            {
              label: 'Edit',
              icon: 'pi pi-fw pi-pencil',
              routerLink: ['apps/cms/edit'],
            },
          ],
        },
        {
          label: 'AI Sandbox',
          icon: 'pi pi-fw pi-sparkles',
          path: '/apps/ai',
          items: [
            { label: 'Chat', icon: 'pi pi-fw pi-comments', routerLink: ['apps/ai/chat'] },
            { label: 'Completion', icon: 'pi pi-fw pi-align-left', routerLink: ['apps/ai/completion'] },
            { label: 'Form Assist', icon: 'pi pi-fw pi-pencil', routerLink: ['apps/ai/assist'] },
            { label: 'Object', icon: 'pi pi-fw pi-code', routerLink: ['apps/ai/object'] },
            { label: 'Tools', icon: 'pi pi-fw pi-wrench', routerLink: ['apps/ai/tools'] },
          ],
        },
        {
          label: 'Chat',
          icon: 'pi pi-fw pi-comments',
          routerLink: ['apps/chat'],
        },
        {
          label: 'Files',
          icon: 'pi pi-fw pi-folder',
          routerLink: ['apps/files'],
        },
        {
          label: 'Mail',
          icon: 'pi pi-fw pi-envelope',
          routerLink: ['apps/mail/inbox'],
        },
        {
          label: 'Task List',
          icon: 'pi pi-fw pi-check-square',
          routerLink: ['apps/tasklist'],
        },
      ],
    },
    {
      label: 'UI Kit',
      icon: 'pi pi-fw pi-star-fill',
      path: '/dashboard/uikit',
      items: [
        {
          label: 'Form Layout',
          icon: 'pi pi-fw pi-id-card',
          routerLink: ['uikit/formlayout'],
        },
        {
          label: 'Input',
          icon: 'pi pi-fw pi-check-square',
          routerLink: ['uikit/input'],
        },

        {
          label: 'Buttons',
          icon: 'pi pi-fw pi-box',
          routerLink: ['uikit/buttons'],
        },
        {
          label: 'Table',
          icon: 'pi pi-fw pi-table',
          routerLink: ['uikit/table'],
        },
        {
          label: 'List',
          icon: 'pi pi-fw pi-list',
          routerLink: ['uikit/list'],
        },
        {
          label: 'Tree',
          icon: 'pi pi-fw pi-share-alt',
          routerLink: ['uikit/tree'],
        },
        {
          label: 'Panel',
          icon: 'pi pi-fw pi-tablet',
          routerLink: ['uikit/panel'],
        },
        {
          label: 'Overlay',
          icon: 'pi pi-fw pi-clone',
          routerLink: ['uikit/overlay'],
        },
        {
          label: 'Media',
          icon: 'pi pi-fw pi-image',
          routerLink: ['uikit/media'],
        },
        {
          label: 'Menu',
          icon: 'pi pi-fw pi-bars',
          routerLink: ['uikit/menu'],
          routerLinkActiveOptions: {
            paths: 'subset',
            queryParams: 'ignored',
            matrixParams: 'ignored',
            fragment: 'ignored',
          },
        },
        {
          label: 'Message',
          icon: 'pi pi-fw pi-comment',
          routerLink: ['uikit/message'],
        },
        {
          label: 'File',
          icon: 'pi pi-fw pi-file',
          routerLink: ['uikit/file'],
        },
        {
          label: 'Chart',
          icon: 'pi pi-fw pi-chart-bar',
          routerLink: ['uikit/charts'],
        },
        {
          label: 'Misc',
          icon: 'pi pi-fw pi-circle-off',
          routerLink: ['uikit/misc'],
        },
      ],
    },
    {
      label: 'Free Blocks',
      icon: 'pi pi-fw pi-eye',
      routerLink: ['blocks'],
    },
    {
      label: 'Pages',
      icon: 'pi pi-fw pi-briefcase',
      path: '/pages',
      items: [
        {
          label: 'Crud',
          icon: 'pi pi-fw pi-pencil',
          routerLink: ['pages/crud'],
        },

        {
          label: 'Invoice',
          icon: 'pi pi-fw pi-dollar',
          routerLink: ['pages/invoice'],
        },
        {
          label: 'Help',
          icon: 'pi pi-fw pi-question-circle',
          routerLink: ['pages/help'],
        },
        {
          label: 'Empty',
          icon: 'pi pi-fw pi-circle-off',
          routerLink: ['pages/empty'],
        },
        {
          label: 'FAQ',
          icon: 'pi pi-fw pi-question',
          routerLink: ['pages/faq'],
        },
        {
          label: 'Contact Us',
          icon: 'pi pi-fw pi-phone',
          routerLink: ['pages/contact'],
        },
      ],
    },
    {
      label: 'E-Commerce',
      icon: 'pi pi-fw pi-wallet',
      path: '/ecommerce',
      items: [
        {
          label: 'Product Overview',
          icon: 'pi pi-fw pi-image',
          routerLink: ['ecommerce/product-overview'],
        },
        {
          label: 'Product List',
          icon: 'pi pi-fw pi-list',
          routerLink: ['ecommerce/product-list'],
        },
        {
          label: 'New Product',
          icon: 'pi pi-fw pi-plus',
          routerLink: ['ecommerce/new-product'],
        },
        {
          label: 'Shopping Cart',
          icon: 'pi pi-fw pi-shopping-cart',
          routerLink: ['ecommerce/shopping-cart'],
        },
        {
          label: 'Checkout Form',
          icon: 'pi pi-fw pi-check-square',
          routerLink: ['ecommerce/checkout-form'],
        },
        {
          label: 'Order History',
          icon: 'pi pi-fw pi-history',
          routerLink: ['ecommerce/order-history'],
        },
        {
          label: 'Order Summary',
          icon: 'pi pi-fw pi-file',
          routerLink: ['ecommerce/order-summary'],
        },
      ],
    },
    {
      label: 'User Management',
      icon: 'pi pi-fw pi-user',
      path: '/profile',
      items: [
        {
          label: 'List',
          icon: 'pi pi-fw pi-list',
          routerLink: ['profile/list'],
        },
        {
          label: 'Create',
          icon: 'pi pi-fw pi-plus',
          routerLink: ['profile/create'],
        },
      ],
    },
  ];

  protected readonly menuItems = signal<MenuItem[]>(this.expandActiveRouteParents(this.baseMenuItems, this.router.url));

  constructor() {
    effect(() => {
      this.menuItems.set(this.expandActiveRouteParents(this.baseMenuItems, this.currentUrl()));
    });
  }

  private expandActiveRouteParents(items: MenuItem[], activeUrl: string): MenuItem[] {
    return this.markExpandedParents(items, this.normalizeUrl(activeUrl)).items;
  }

  private markExpandedParents(items: MenuItem[], activeUrl: string): { items: MenuItem[]; active: boolean } {
    let active = false;

    const expandedItems = items.map((item) => {
      const childResult = item.items?.length ? this.markExpandedParents(item.items, activeUrl) : null;
      const itemActive = this.isRouteActive(item, activeUrl);
      const childActive = childResult?.active ?? false;

      active ||= itemActive || childActive;

      return {
        ...item,
        items: childResult?.items ?? item.items,
        expanded: item.items?.length ? itemActive || childActive : item.expanded,
      };
    });

    return { items: expandedItems, active };
  }

  private isRouteActive(item: MenuItem, activeUrl: string): boolean {
    const routePath = this.getRoutePath(item);

    if (!routePath) return false;

    if (this.usesSubsetPathMatching(item.routerLinkActiveOptions)) {
      return activeUrl === routePath || activeUrl.startsWith(`${routePath}/`);
    }

    return activeUrl === routePath;
  }

  private getRoutePath(item: MenuItem): string | null {
    const routerLink: unknown = item.routerLink;

    if (Array.isArray(routerLink)) {
      const segments = routerLink.map((segment) => String(segment)).filter(Boolean);

      if (!segments.length) return null;

      return this.normalizeUrl(segments[0].startsWith('/') ? segments.join('/') : `/dashboard/${segments.join('/')}`);
    }

    if (typeof routerLink === 'string') {
      return this.normalizeUrl(routerLink.startsWith('/') ? routerLink : `/dashboard/${routerLink}`);
    }

    return null;
  }

  private usesSubsetPathMatching(options: unknown): boolean {
    return typeof options === 'object' && options !== null && 'paths' in options && options.paths === 'subset';
  }

  private normalizeUrl(url: string): string {
    const path = url.split(/[?#]/, 1)[0].replace(/\/+/g, '/');
    const prefixedPath = path.startsWith('/') ? path : `/${path}`;

    return prefixedPath.length > 1 ? prefixedPath.replace(/\/$/, '') : prefixedPath;
  }
}
