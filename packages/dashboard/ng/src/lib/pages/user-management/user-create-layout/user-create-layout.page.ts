import { Component, inject } from '@angular/core';

import { Router, RouterOutlet } from '@angular/router';
import { FormStateService } from '../form-state.service';

interface MenuItem {
    label: string;
    shortLabel: string;
    icon: string;
    route: string;
}

/** Multi-step user creation wizard layout. */
@Component({
    selector: 'app-user-create-layout-page',
    imports: [RouterOutlet],
    providers: [FormStateService],
    templateUrl: './user-create-layout.page.html',
})
export class UserCreateLayoutPage {
    menuItems: MenuItem[] = [
        {
            label: 'Basic Information',
            shortLabel: 'Basic',
            icon: 'pi pi-user',
            route: '/dashboard/profile/create/basic-information'
        },
        {
            label: 'Business Information',
            shortLabel: 'Business',
            icon: 'pi pi-briefcase',
            route: '/dashboard/profile/create/business-information'
        },
        {
            label: 'Location Information',
            shortLabel: 'Location',
            icon: 'pi pi-map-marker',
            route: '/dashboard/profile/create/location-information'
        },
        {
            label: 'Authorization and Access',
            shortLabel: 'Access',
            icon: 'pi pi-key',
            route: '/dashboard/profile/create/authorization'
        },
        {
            label: 'Account Status',
            shortLabel: 'Status',
            icon: 'pi pi-shield',
            route: '/dashboard/profile/create/account-status'
        }
    ];

    currentRoute = '';

    private readonly router = inject(Router);
    constructor() {
        this.router.events.subscribe(() => {
            this.currentRoute = this.router.url;
        });
    }

    /**
     * Runs is active.
     *
     * @param menuRoute - menu route value.
     *
     * @returns The user create layout page is active result.
     */
    isActive(menuRoute: string): boolean {
        return this.currentRoute === menuRoute;
    }

    /**
     * Runs navigate to.
     *
     * @param menuRoute - menu route value.
     */
    navigateTo(menuRoute: string) {
        this.router.navigate([menuRoute]);
    }

    /**
     * Runs get menu button class.
     *
     * @param route - route value.
     *
     * @returns The user create layout page get menu button class result.
     */
    getMenuButtonClass(route: string): string {
        const baseClass = 'pl-3 pr-2 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer';
        if (this.isActive(route)) {
            return `${baseClass} bg-primary text-surface-0 dark:text-surface-900 shadow-sm`;
        }
        return `${baseClass} text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700`;
    }

    /**
     * Runs get mobile menu button class.
     *
     * @param route - route value.
     *
     * @returns The user create layout page get mobile menu button class result.
     */
    getMobileMenuButtonClass(route: string): string {
        const baseClass = 'px-4 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap';
        if (this.isActive(route)) {
            return `${baseClass} bg-primary text-surface-0 dark:text-surface-900 shadow-sm`;
        }
        return `${baseClass} bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700`;
    }
}
