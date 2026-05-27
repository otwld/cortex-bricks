import { Routes } from '@angular/router';
import { OAuthCompletePage } from './oauth-complete/oauth-complete';
import { AcceptInvitationPage } from './accept-invitation/accept-invitation';

/** Routes for users. */
export const usersRoutes: Routes = [
  {
    path: 'accept-invitation',
    children: [
      { path: 'oauth-complete', component: OAuthCompletePage },
      { path: ':token', component: AcceptInvitationPage },
      { path: '', component: AcceptInvitationPage },
    ],
  },
];
