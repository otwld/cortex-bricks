import type { Routes } from '@angular/router';
import { ChatContract } from '@otwld/ts-chat';
import { BearerTokenWsAuthAdapter, provideWebsocket } from '@otwld/ng-websocket';

function websocketUrl(): string {
  return typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin;
}

/**
 * Development websocket demo route with a local bearer-token auth adapter.
 */
export const websocketDemoRoutes: Routes = [
  {
    path: 'ws-demo',
    providers: [
      provideWebsocket(ChatContract, {
        url: websocketUrl(),
        auth: {
          adapter: BearerTokenWsAuthAdapter.from(() => 'demo-user'),
        },
        autoConnect: true,
        transports: ['websocket'],
      }),
    ],
    loadComponent: () => import('./ws-demo.component').then((m) => m.WsDemoComponent),
  },
];
