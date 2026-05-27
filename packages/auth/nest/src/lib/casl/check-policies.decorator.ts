import { SetMetadata } from '@nestjs/common';
import { AnyPolicyHandler } from './policy-handler';

/**
 * Metadata key storing route policy handlers.
 *
 * @example
 * ```ts
 * const key = CHECK_POLICIES_KEY;
 * ```
 */
export const CHECK_POLICIES_KEY = 'check_policy';

/**
 * Attaches CASL policy handlers to a route handler.
 *
 * @param handlers - Policy handlers that must all allow the request.
 * @returns Nest metadata decorator for the supplied policy handlers.
 * @example
 * ```ts
 * @CheckPolicies((ability) => ability.can('read', 'User'))
 * ```
 */
export const CheckPolicies = (...handlers: AnyPolicyHandler[]) => SetMetadata(CHECK_POLICIES_KEY, handlers);
