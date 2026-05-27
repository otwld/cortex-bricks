import { Injectable, computed, inject } from '@angular/core';
import { createMongoAbility, type AbilityTuple, type MongoAbility, type RawRuleFrom } from '@casl/ability';
import { AuthStateService, AuthUser } from '../services/auth-state.service';

type AppAbilityTuple = AbilityTuple<string, string>;
type AppAbilityRule = RawRuleFrom<AppAbilityTuple, Record<string, unknown>>;

/**
 * Builds a CASL ability instance from the authenticated user's permission list.
 *
 * Permission strings are expected to use `action:subject` format. A literal `*`
 * grants `manage` access to `all` subjects.
 *
 * @param user - Authenticated user to translate into CASL rules, or `null` when no user is signed in.
 * @returns A CASL Mongo ability configured for the user's direct and role-derived permissions.
 *
 * @example
 * ```ts
 * const ability = buildAbilityFromUser({
 *   _id: 'user_1',
 *   email: 'user@example.com',
 *   emailVerified: true,
 *   roles: [{ name: 'admin', permissions: ['manage:Project'] }],
 *   permissions: ['read:Invoice'],
 * });
 * ```
 */
function buildAbilityFromUser(user: AuthUser | null): MongoAbility<AppAbilityTuple, Record<string, unknown>> {
  if (!user) return createMongoAbility<AppAbilityTuple, Record<string, unknown>>([]);

  const rules: AppAbilityRule[] = [];

  const allPermissions = [
    ...user.roles.flatMap((r) => r.permissions),
    ...user.permissions,
  ];

  for (const perm of allPermissions) {
    if (perm === '*') {
      rules.push({ action: 'manage', subject: 'all' });
    } else {
      const [action, subject] = perm.split(':');
      if (action && subject) rules.push({ action, subject });
    }
  }

  return createMongoAbility<AppAbilityTuple, Record<string, unknown>>(rules);
}

/**
 * Provides the current authorization ability derived from auth state.
 *
 * @example
 * ```ts
 * const canReadInvoices = abilityService.ability().can('read', 'Invoice');
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AbilityService {
  /**
   * Tracks the currently authenticated user used to derive authorization rules.
   */
  private readonly authState = inject(AuthStateService);

  /**
   * Computed CASL ability that updates whenever the authenticated user changes.
   */
  readonly ability = computed(() => buildAbilityFromUser(this.authState.user()));
}
