import { Component, inject } from '@angular/core';

import { Router, RouterOutlet } from '@angular/router';
import { FormStateService } from '../form-state.service';
import { Card } from 'primeng/card';

interface MenuItem {
    label: string;
    shortLabel: string;
    icon: string;
    route: string;
}

/** Multi-step user creation wizard layout. */
@Component({
    selector: 'app-user-create-layout-page',
    imports: [RouterOutlet, Card],
    providers: [FormStateService],
    templateUrl: './user-create-layout.page.html',
})
export class UserCreateLayoutPage {
    /**
     * Wizard navigation items in display order.
     */
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

    /**
     * Current router URL used to style the active wizard step.
     */
    currentRoute = '';

    private readonly router = inject(Router);
    constructor() {
        this.router.events.subscribe(() => {
            this.currentRoute = this.router.url;
        });
    }

    /**
     * Checks whether a wizard menu route is the current route.
     *
     * @param menuRoute - Wizard route to compare against the current URL.
     * @returns True when the route is active.
     */
    isActive(menuRoute: string): boolean {
        return this.currentRoute === menuRoute;
    }

    /**
     * Navigates to a wizard step route.
     *
     * @param menuRoute - Wizard route to navigate to.
     */
    navigateTo(menuRoute: string) {
        this.router.navigate([menuRoute]);
    }

    /**
     * Builds the desktop menu button class for a wizard route.
     *
     * @param route - Wizard route represented by the button.
     * @returns Class string for active or inactive desktop menu state.
     */
    getMenuButtonClass(route: string): string {
        const baseClass = 'pl-3 pr-2 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer';
        if (this.isActive(route)) {
            return `${baseClass} bg-primary text-surface-0 dark:text-surface-900 shadow-sm`;
        }
        return `${baseClass} text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700`;
    }

    /**
     * Builds the mobile menu button class for a wizard route.
     *
     * @param route - Wizard route represented by the button.
     * @returns Class string for active or inactive mobile menu state.
     */
    getMobileMenuButtonClass(route: string): string {
        const baseClass = 'px-4 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap';
        if (this.isActive(route)) {
            return `${baseClass} bg-primary text-surface-0 dark:text-surface-900 shadow-sm`;
        }
        return `${baseClass} bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700`;
    }
}
