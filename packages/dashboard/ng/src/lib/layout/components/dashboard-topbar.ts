import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { StyleClassModule } from 'primeng/styleclass';
import { DashboardBreadcrumb } from './dashboard-breadcrumb';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DashboardLayoutService } from '@otwld/ng-dashboard/core';

@Component({
  selector: 'dashboard-topbar',
  imports: [RouterModule, StyleClassModule, DashboardBreadcrumb, InputTextModule, ButtonModule, IconFieldModule, InputIconModule],
  styleUrl: './dashboard-topbar.scss',
  template: `<div class="layout-topbar">
    <div class="topbar-start">
      <button type="button" class="topbar-menubutton p-link p-trigger hover:cursor-pointer" (click)="layoutService.toggleMenu()">
        <i class="pi pi-bars"></i>
      </button>
      <nav dashboard-breadcrumb class="topbar-breadcrumb"></nav>
    </div>

    <div class="topbar-end">
      <ul class="topbar-menu">
        <li class="topbar-search">
          <p-iconfield>
            <p-inputicon class="pi pi-search" />
            <input type="text" pInputText placeholder="Search" class="w-48 sm:w-full" />
          </p-iconfield>
        </li>
        <li class="ml-3">
          <p-button icon="pi pi-palette" rounded (onClick)="layoutService.toggleConfigSidebar()" />
        </li>
        <li class="topbar-profile">
          <button type="button" class="p-link hover:cursor-pointer" (click)="layoutService.toggleProfileSidebar()">
            <img src="/layout/images/avatar.png" alt="Profile" />
          </button>
        </li>
      </ul>
    </div>
  </div>`,
})
export class DashboardTopbar {
  protected readonly layoutService = inject(DashboardLayoutService);
}
