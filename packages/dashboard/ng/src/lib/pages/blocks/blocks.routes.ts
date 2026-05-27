import { Routes } from '@angular/router';

/** Routes for the blocks showcase section. */
export const blocksRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./blocks.page').then((c) => c.BlocksPage),
    data: { breadcrumb: 'Free Blocks' },
  },
];
