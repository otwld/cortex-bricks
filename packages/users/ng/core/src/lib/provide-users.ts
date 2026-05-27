import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { UsersService } from './services/users.service';
import { USERS_CONFIG, UsersConfig } from './tokens/users-config.token';

/** Registers Angular users client providers. */
/**
 * Runs provide users.
 *
 * @param config - config value.
 *
 * @returns The provide users result.
 */
export function provideUsers(config: UsersConfig): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: USERS_CONFIG, useValue: config }, UsersService]);
}
