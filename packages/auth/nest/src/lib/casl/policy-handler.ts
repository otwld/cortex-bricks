import { AnyAbility } from '@casl/ability';

/**
 * Object-style route policy handler evaluated by PoliciesGuard.
 *
 * @example
 * ```ts
 * const handler: PolicyHandler = { handle: (ability) => ability.can('read', 'User') };
 * ```
 */
export interface PolicyHandler {
  /**
   * Evaluates whether the supplied ability satisfies the policy.
   *
   * @param ability - CASL ability for the current user.
   * @returns True when the request should be authorized.
   * @example
   * ```ts
   * const allowed = handler.handle(ability);
   * ```
   */
  handle(ability: AnyAbility): boolean;
}

/**
 * Function-style route policy handler evaluated by PoliciesGuard.
 *
 * @param ability - CASL ability for the current user.
 * @returns True when the request should be authorized.
 * @example
 * ```ts
 * const canReadUsers: PolicyHandlerFn = (ability) => ability.can('read', 'User');
 * ```
 */
export type PolicyHandlerFn = (ability: AnyAbility) => boolean;

/**
 * Supported route policy handler shapes.
 *
 * @example
 * ```ts
 * const handlers: AnyPolicyHandler[] = [canReadUsers, { handle: canReadUsers }];
 * ```
 */
export type AnyPolicyHandler = PolicyHandler | PolicyHandlerFn;
