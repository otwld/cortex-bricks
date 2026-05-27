import { InjectionToken } from '@angular/core';

/** Runtime configuration for the Angular users client. */
export interface UsersConfig {
  /** Base URL for user-management endpoints. */
  apiUrl: string;
}

/** Injection token for users client configuration. */
export const USERS_CONFIG = new InjectionToken<UsersConfig>('USERS_CONFIG');
