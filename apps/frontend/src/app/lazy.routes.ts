import { inject, provideEnvironmentInitializer } from '@angular/core';
import { Routes } from '@angular/router';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { PrimeNG } from 'primeng/config';
import { authRoutes } from '@otwld/ng-auth';
import { authGuard } from '@otwld/ng-auth/core';
import { provideDashboardLayoutConfig, provideDashboardLayoutState } from '@otwld/ng-dashboard/core';

const auraPrimitive = Aura.primitive;
if (auraPrimitive === undefined) {
  throw new Error('PrimeNG Aura preset is missing primitive color tokens.');
}

const BlueAura = definePreset(Aura, {
  semantic: {
    primary: auraPrimitive.blue,
    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.700}',
          focusColor: '{primary.800}',
        },
      },
      dark: {
        primary: {
          color: '{primary.400}',
          contrastColor: '{surface.900}',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)',
        },
      },
    },
  },
});

const primeNgProvider = provideEnvironmentInitializer(() => {
  inject(PrimeNG).setConfig({
    theme: {
      preset: BlueAura,
      options: {
        darkModeSelector: '.app-dark',
        cssLayer: {
          name: 'primeng',
          order: 'theme, base, primeng',
        },
      },
    },
  });
});

/**
 * Auth routes wrapped with PrimeNG theme providers.
 */
export const authPrimeNgRoutes: Routes = [
  {
    path: '',
    providers: [primeNgProvider],
    children: authRoutes,
  },
];

/**
 * User-management routes wrapped with PrimeNG theme providers.
 */
export const usersPrimeNgRoutes: Routes = [
  {
    path: '',
    providers: [primeNgProvider],
    loadChildren: () => import('@otwld/ng-users').then((m) => m.usersRoutes),
  },
];

/**
 * Dashboard routes wrapped with PrimeNG theme and dashboard layout providers.
 */
export const dashboardPrimeNgRoutes: Routes = [
  {
    path: '',
    providers: [
      primeNgProvider,
      provideDashboardLayoutConfig(),
      provideDashboardLayoutState({
        sidebarExpanded: true,
        overlayMenuActive: false,
      }),
    ],
    loadComponent: () => import('@otwld/ng-dashboard/layout').then((m) => m.DashboardLayout),
    loadChildren: () => import('@otwld/ng-dashboard/routes').then((m) => m.dashboardChildRoutes),
    canActivate: [authGuard],
  },
];
