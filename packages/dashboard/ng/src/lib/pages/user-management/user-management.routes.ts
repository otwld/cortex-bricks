import { Routes } from '@angular/router';
import { AccountStatus } from './steps/account-status/account-status';
import { Authorization } from './steps/authorization/authorization';
import { BasicInformation } from './steps/basic-information/basic-information';
import { BusinessInformation } from './steps/business-information/business-information';
import { LocationInformation } from './steps/location-information/location-information';
import { UserCreateLayoutPage } from './user-create-layout/user-create-layout.page';
import { UserListPage } from './user-list/user-list.page';

/** Routes for the user management section. */
export const userManagementRoutes: Routes = [
  { path: 'list', component: UserListPage },
  {
    path: 'create',
    component: UserCreateLayoutPage,
    children: [
      { path: '', redirectTo: 'basic-information', pathMatch: 'full' },
      { path: 'basic-information', component: BasicInformation },
      { path: 'business-information', component: BusinessInformation },
      { path: 'location-information', component: LocationInformation },
      { path: 'authorization', component: Authorization },
      { path: 'account-status', component: AccountStatus },
    ],
  },
  { path: '', redirectTo: 'list', pathMatch: 'full' },
];
