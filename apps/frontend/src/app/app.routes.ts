import { Routes } from '@angular/router';
import { websocketDemoRoutes } from './ws-demo/ws-demo.routes';

/** Root route table for the frontend application. */
export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'auth',
    loadChildren: () => import('./lazy.routes').then((m) => m.authPrimeNgRoutes),
  },
  {
    path: '',
    loadChildren: () => import('./lazy.routes').then((m) => m.usersPrimeNgRoutes),
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./lazy.routes').then((m) => m.dashboardPrimeNgRoutes),
  },
  ...websocketDemoRoutes,
  {
    path: 'notfound',
    loadComponent: () => import('@otwld/ng-dashboard/pages/notfound').then((m) => m.NotFoundPage),
  },
  //  { path: '**', redirectTo: '/notfound' },
  //   component: DashboardLayout,
  //   children: [
  //     {
  //       path: '',
  //       loadComponent: () =>
  //         import('./pages/dashboards/ecommercedashboard').then(
  //           (c) => c.EcommerceDashboard,
  //         ),
  //       data: { breadcrumb: 'E-Commerce Dashboard' },
  //     },
  //     {
  //       path: 'dashboard-banking',
  //       loadComponent: () =>
  //         import('./pages/dashboards/bankingdashboard').then(
  //           (c) => c.BankingDashboard,
  //         ),
  //       data: { breadcrumb: 'Banking Dashboard' },
  //     },
  //     {
  //       path: 'uikit',
  //       data: { breadcrumb: 'UI Kit' },
  //       loadChildren: () => import('./pages/uikit/uikit.routes'),
  //     },
  //     {
  //       path: 'documentation',
  //       data: { breadcrumb: 'Documentation' },
  //       loadComponent: () =>
  //         import('./pages/documentation/documentation').then(
  //           (c) => c.Documentation,
  //         ),
  //     },
  //     {
  //       path: 'pages',
  //       loadChildren: () => import('./pages/pages.routes'),
  //     },
  //     {
  //       path: 'apps',
  //       loadChildren: () => import('./app/apps/apps.routes'),
  //       data: { breadcrumb: 'Apps' },
  //     },
  //
  //     {
  //       path: 'blocks',
  //       data: { breadcrumb: 'Free Blocks' },
  //       loadChildren: () => import('./pages/blocks/blocks.routes'),
  //     },
  //     {
  //       path: 'ecommerce',
  //       loadChildren: () => import('./pages/ecommerce/ecommerce.routes'),
  //       data: { breadcrumb: 'E-Commerce' },
  //     },
  //     {
  //       path: 'profile',
  //       loadChildren: () =>
  //         import('./pages/usermanagement/usermanagement.routes'),
  //     },
  //   ],
  // },
  // { path: 'landing', component: Landing },
  // { path: 'notfound', component: Notfound },
  // {
  //   path: 'auth',
  //   loadChildren: () => import('./pages/auth/auth.routes'),
  // },
  // { path: '**', redirectTo: '/notfound' },
];
