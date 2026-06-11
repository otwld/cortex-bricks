import { Routes } from '@angular/router';

/** Route catalog for simple dashboard utility pages. */
export const dashboardPagesRoutes: Routes = [
  {
    path: 'crud',
    data: { breadcrumb: 'Crud' },
    loadComponent: () => import('./crud').then((m) => m.CrudPage),
  },
  {
    path: 'empty',
    data: { breadcrumb: 'Empty' },
    loadComponent: () => import('./empty').then((m) => m.EmptyPage),
  },
  {
    path: 'invoice',
    data: { breadcrumb: 'Invoice' },
    loadComponent: () => import('./invoice').then((m) => m.InvoicePage),
  },
  {
    path: 'help',
    data: { breadcrumb: 'Help' },
    loadComponent: () => import('./help').then((m) => m.HelpPage),
  },
  {
    path: 'faq',
    data: { breadcrumb: 'FAQ' },
    loadComponent: () => import('./faq').then((m) => m.FaqPage),
  },
  {
    path: 'contact',
    data: { breadcrumb: 'Contact Us' },
    loadComponent: () => import('./contact-us').then((m) => m.ContactUsPage),
  },
];
