import { AnyAbility } from '@casl/ability';
import { AuthAccount } from '../auth-account/auth-account.schema';

/**
 * Application-provided factory that builds CASL abilities for authenticated users.
 *
 * @example
 * ```ts
 * class AppAbilityFactory extends CaslAbilityFactory {
 *   createForUser(user: AuthAccount): AnyAbility {
 *     return ability;
 *   }
 * }
 * ```
 */
export abstract class CaslAbilityFactory {
  /**
   * Creates a CASL ability for the supplied user.
   *
   * @param user - AuthAccount whose roles and permissions should shape the ability.
   * @returns CASL ability used by policy handlers.
   * @example
   * ```ts
   * const ability = abilityFactory.createForUser(user);
   * ```
   */
  abstract createForUser(user: AuthAccount): AnyAbility;
}
