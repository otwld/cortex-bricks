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
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('@otwld/ng-dashboard/ecommerce').then((c) => c.DashboardEcommercePage),
        data: { breadcrumb: 'E-Commerce Dashboard' },
      },
      {
        path: 'banking',
        loadComponent: () => import('@otwld/ng-dashboard/banking').then((c) => c.DashboardBankingPage),
        data: { breadcrumb: 'Banking Dashboard' },
      },
      {
        path: 'uikit',
        data: { breadcrumb: 'UI Kit' },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'buttons' },
          { path: 'button', pathMatch: 'full', redirectTo: 'buttons' },
          {
            path: 'buttons',
            data: { breadcrumb: 'Buttons' },
            loadComponent: () => import('@otwld/ng-dashboard/uikit/buttons').then((c) => c.DashboardUikitButtonsPage),
          },
          { path: 'charts', data: { breadcrumb: 'Charts' }, loadComponent: () => import('@otwld/ng-dashboard/uikit/chartdemo').then((c) => c.ChartDemo) },
          { path: 'file', data: { breadcrumb: 'File' }, loadComponent: () => import('@otwld/ng-dashboard/uikit/filedemo').then((c) => c.FileDemo) },
          {
            path: 'formlayout',
            data: { breadcrumb: 'Form Layout' },
            loadComponent: () => import('@otwld/ng-dashboard/uikit/formlayoutdemo').then((c) => c.FormLayoutDemo),
          },
          { path: 'input', data: { breadcrumb: 'Input' }, loadComponent: () => import('@otwld/ng-dashboard/uikit/inputdemo').then((c) => c.InputDemo) },
          { path: 'list', data: { breadcrumb: 'List' }, loadComponent: () => import('@otwld/ng-dashboard/uikit/listdemo').then((c) => c.ListDemo) },
          { path: 'media', data: { breadcrumb: 'Media' }, loadComponent: () => import('@otwld/ng-dashboard/uikit/mediademo').then((c) => c.MediaDemo) },
          {
            path: 'message',
            data: { breadcrumb: 'Message' },
            loadComponent: () => import('@otwld/ng-dashboard/uikit/messagesdemo').then((c) => c.MessagesDemo),
          },
          { path: 'misc', data: { breadcrumb: 'Misc' }, loadComponent: () => import('@otwld/ng-dashboard/uikit/miscdemo').then((c) => c.MiscDemo) },
          { path: 'panel', data: { breadcrumb: 'Panel' }, loadComponent: () => import('@otwld/ng-dashboard/uikit/panelsdemo').then((c) => c.PanelsDemo) },
          {
            path: 'timeline',
            data: { breadcrumb: 'Timeline' },
            loadComponent: () => import('@otwld/ng-dashboard/uikit/timelinedemo').then((c) => c.TimelineDemo),
          },
          { path: 'table', data: { breadcrumb: 'Table' }, loadComponent: () => import('@otwld/ng-dashboard/uikit/tabledemo').then((c) => c.TableDemo) },
          {
            path: 'overlay',
            data: { breadcrumb: 'Overlay' },
            loadComponent: () => import('@otwld/ng-dashboard/uikit/overlaydemo').then((c) => c.OverlayDemo),
          },
          { path: 'tree', data: { breadcrumb: 'Tree' }, loadComponent: () => import('@otwld/ng-dashboard/uikit/treedemo').then((c) => c.TreeDemo) },
          { path: 'menu', data: { breadcrumb: 'Menu' }, loadComponent: () => import('@otwld/ng-dashboard/uikit/menudemo').then((c) => c.MenuDemo) },
        ],
      },
      {
        path: 'pages',
        data: { breadcrumb: 'Pages' },
        children: [
          { path: 'crud', data: { breadcrumb: 'Crud' }, loadComponent: () => import('@otwld/ng-dashboard/pages/crud').then((m) => m.CrudPage) },
          { path: 'empty', data: { breadcrumb: 'Empty' }, loadComponent: () => import('@otwld/ng-dashboard/pages/empty').then((m) => m.EmptyPage) },
          { path: 'invoice', data: { breadcrumb: 'Invoice' }, loadComponent: () => import('@otwld/ng-dashboard/pages/invoice').then((m) => m.InvoicePage) },
          { path: 'help', data: { breadcrumb: 'Help' }, loadComponent: () => import('@otwld/ng-dashboard/pages/help').then((m) => m.HelpPage) },
          { path: 'faq', data: { breadcrumb: 'FAQ' }, loadComponent: () => import('@otwld/ng-dashboard/pages/faq').then((m) => m.FaqPage) },
          {
            path: 'contact',
            data: { breadcrumb: 'Contact Us' },
            loadComponent: () => import('@otwld/ng-dashboard/pages/contact-us').then((m) => m.ContactUsPage),
          },
        ],
      },
      {
        path: 'blocks',
        data: { breadcrumb: 'Free Blocks' },
        loadChildren: () => import('@otwld/ng-dashboard/pages/blocks').then((m) => m.blocksRoutes),
      },
      {
        path: 'ecommerce',
        data: { breadcrumb: 'E-Commerce' },
        loadChildren: () => import('@otwld/ng-dashboard/pages/ecommerce').then((m) => m.ecommerceRoutes),
      },
      {
        path: 'profile',
        loadChildren: () => import('@otwld/ng-dashboard/pages/user-management').then((m) => m.userManagementRoutes),
      },
      {
        path: 'apps',
        data: { breadcrumb: 'Apps' },
        loadChildren: () => import('@otwld/ng-dashboard/apps').then((m) => m.dashboardAppsRoutes),
      },
    ],
  },
];
