import { Routes } from '@angular/router';

export const aiRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'chat' },
  { path: 'chat', loadComponent: () => import('./chat').then((m) => m.AiChatPage), data: { breadcrumb: 'AI Chat' } },
  { path: 'completion', loadComponent: () => import('./completion').then((m) => m.AiCompletionPage), data: { breadcrumb: 'AI Completion' } },
  { path: 'assist', loadComponent: () => import('./assist').then((m) => m.AiAssistPage), data: { breadcrumb: 'AI Form Assist' } },
  { path: 'object', loadComponent: () => import('./object').then((m) => m.AiObjectPage), data: { breadcrumb: 'AI Object' } },
  { path: 'tools', loadComponent: () => import('./tools').then((m) => m.AiToolsPage), data: { breadcrumb: 'AI Tools' } },
];
