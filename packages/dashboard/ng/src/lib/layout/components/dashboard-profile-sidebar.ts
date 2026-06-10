import { Component, computed, inject, ViewEncapsulation } from '@angular/core';

import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { DashboardLayoutService } from '@otwld/ng-dashboard/core';
import { AuthService } from '@otwld/ng-auth/core';

/**
 * Profile drawer shown from the dashboard topbar.
 */
@Component({
  selector: 'dashboard-profile-sidebar',
  imports: [AvatarModule, BadgeModule, DrawerModule, MenuModule, RippleModule],
  styleUrl: './dashboard-profile-sidebar.scss',
  encapsulation: ViewEncapsulation.None,
  template: `
    <p-drawer
      [visible]="visible()"
      (onHide)="hideProfileSidebar()"
      position="right"
      header="Profile"
      [transitionOptions]="'.3s cubic-bezier(0, 0, 0.2, 1)'"
      styleClass="layout-profile-sidebar w-full sm:w-25rem"
    >
      <p-menu [model]="items" ariaLabel="Profile sidebar" styleClass="w-full border-0! bg-transparent p-0">
        <ng-template #start>
          <span class="inline-flex items-center gap-3 px-2 py-2">
            <p-avatar label="IA" shape="circle" styleClass="bg-primary text-primary-contrast" />
            <span class="inline-flex flex-col">
              <span class="font-semibold">Welcome</span>
              <span class="text-surface-500 dark:text-surface-400 font-medium">Isabella Andolini</span>
            </span>
          </span>
        </ng-template>

        <ng-template #submenuheader let-item>
          <span class="flex flex-col pt-6 pb-3">
            <span class="text-primary font-bold">{{ item.label }}</span>
            @if (item.description) {
              <span class="text-surface-500 dark:text-surface-400 font-medium mt-2">{{ item.description }}</span>
            }
          </span>
        </ng-template>

        <ng-template #item let-item>
          <a
            pRipple
            class="cursor-pointer flex p-4 items-center border border-surface-200 dark:border-surface-700 rounded hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150"
            [class]="item.linkClass"
          >
            @if (item.image) {
              <p-avatar [image]="item.image" shape="circle" />
            } @else {
              <p-avatar [icon]="item.icon" shape="circle" styleClass="bg-primary-50 text-primary" />
            }
            <span class="inline-flex flex-col ml-4">
              <span class="mb-2 font-semibold">{{ item.label }}</span>
              <span class="text-surface-500 dark:text-surface-400 m-0">{{ item.description }}</span>
            </span>
            @if (item.badge) {
              <p-badge class="ml-auto" [value]="item.badge" />
            }
          </a>
        </ng-template>

        <ng-template #end>
          <button
            pRipple
            type="button"
            class="relative overflow-hidden w-full border-0 bg-transparent flex items-center p-4 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-none cursor-pointer transition-colors duration-200 text-red-500 dark:text-red-400"
            (click)="signOut()"
          >
            <i class="pi pi-power-off"></i>
            <span class="font-semibold ml-3">Sign Out</span>
          </button>
        </ng-template>
      </p-menu>
    </p-drawer>
  `,
  styles: `
    ::ng-deep .p-menu-item:not(:last-child) {
      margin-bottom: 1rem;
    }
  `,
})
export class DashboardProfileSidebar {
  private readonly layoutService = inject(DashboardLayoutService);

  private readonly authService = inject(AuthService);

  protected readonly visible = computed(() => !!this.layoutService.layoutState().profileSidebarVisible);

  protected readonly items: MenuItem[] = [
    { separator: true },
    {
      label: 'Profile',
      items: [
        {
          label: 'Profile',
          icon: 'pi pi-user',
          description: 'Lorem ipsum date visale',
        },
        {
          label: 'Billing',
          icon: 'pi pi-money-bill',
          description: 'Amet minim mollit',
        },
        {
          label: 'Settings',
          icon: 'pi pi-cog',
          description: 'Exercitation veniam',
        },
      ],
    },
    {
      label: 'Notifications',
      description: 'You have 3 notifications',
      items: [
        {
          label: 'Your post has new comments',
          icon: 'pi pi-comment',
          description: '5 min ago',
        },
        {
          label: 'Your post has been deleted',
          icon: 'pi pi-trash',
          description: '15 min ago',
        },
        {
          label: 'Post has been updated',
          icon: 'pi pi-folder',
          description: '3h ago',
        },
      ],
    },
    {
      label: 'Messages',
      description: 'You have new messages',
      items: [
        {
          label: 'James Robinson',
          image: '/demo/images/avatar/circle/avatar-m-8.png',
          description: '10 min ago',
          badge: '3',
        },
        {
          label: 'Mary Watson',
          image: '/demo/images/avatar/circle/avatar-f-8.png',
          description: '15 min ago',
          badge: '1',
        },
        {
          label: 'Aisha Webb',
          image: '/demo/images/avatar/circle/avatar-f-4.png',
          description: '3h ago',
          badge: '2',
        },
      ],
    },
    { separator: true },
  ];

  protected hideProfileSidebar(): void {
    this.layoutService.layoutState.update((state) => ({
      ...state,
      profileSidebarVisible: false,
    }));
  }

  protected signOut(): void {
    this.hideProfileSidebar();
    this.authService.logout().subscribe({ error: () => undefined });
  }
}
