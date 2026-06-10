import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * SSR route policy for the frontend app.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
