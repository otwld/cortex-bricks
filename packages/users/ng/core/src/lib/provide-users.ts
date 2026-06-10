import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { UsersService } from './services/users.service';
import { USERS_CONFIG, UsersConfig } from './tokens/users-config.token';

/**
 * Registers Angular users client providers with the given API configuration.
 *
 * @param config - Users client configuration.
 * @returns Environment providers for the users API client.
 */
export function provideUsers(config: UsersConfig): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: USERS_CONFIG, useValue: config }, UsersService]);
}
