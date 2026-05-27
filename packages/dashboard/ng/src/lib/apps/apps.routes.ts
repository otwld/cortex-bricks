import { Routes } from '@angular/router';

/** Routes for the dashboard apps section. */
export const dashboardAppsRoutes: Routes = [
  { path: 'ai', loadChildren: () => import('./ai').then((m) => m.aiRoutes), data: { breadcrumb: 'AI Sandbox' } },
  { path: 'cms', loadChildren: () => import('./cms').then((m) => m.cmsRoutes), data: { breadcrumb: 'CMS' } },
  { path: 'chat', loadComponent: () => import('./chat').then((m) => m.ChatPage), data: { breadcrumb: 'Chat' } },
  { path: 'files', loadComponent: () => import('./files').then((m) => m.FilesPage), data: { breadcrumb: 'Files' } },
  { path: 'mail', loadChildren: () => import('./mail').then((m) => m.mailRoutes), data: { breadcrumb: 'Mail' } },
  { path: 'tasklist', loadComponent: () => import('./tasklist').then((m) => m.TaskListPage), data: { breadcrumb: 'Task List' } },
];
