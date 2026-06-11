import { Routes } from '@angular/router';

/** Child route catalog rendered inside the reusable dashboard layout module. */
export const dashboardChildRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./ecommerce').then((m) => m.DashboardEcommercePage),
    data: { breadcrumb: 'E-Commerce Dashboard' },
  },
  {
    path: 'banking',
    loadComponent: () => import('./banking').then((m) => m.DashboardBankingPage),
    data: { breadcrumb: 'Banking Dashboard' },
  },
  {
    path: 'uikit',
    data: { breadcrumb: 'UI Kit' },
    loadChildren: () => import('./uikit').then((m) => m.dashboardUikitRoutes),
  },
  {
    path: 'pages',
    data: { breadcrumb: 'Pages' },
    loadChildren: () => import('./pages').then((m) => m.dashboardPagesRoutes),
  },
  {
    path: 'blocks',
    data: { breadcrumb: 'Free Blocks' },
    loadChildren: () => import('./pages/blocks').then((m) => m.blocksRoutes),
  },
  {
    path: 'ecommerce',
    data: { breadcrumb: 'E-Commerce' },
    loadChildren: () => import('./pages/ecommerce').then((m) => m.ecommerceRoutes),
  },
  {
    path: 'profile',
    loadChildren: () => import('./pages/user-management').then((m) => m.userManagementRoutes),
  },
  {
    path: 'apps',
    data: { breadcrumb: 'Apps' },
    loadChildren: () => import('./apps').then((m) => m.dashboardAppsRoutes),
  },
];
