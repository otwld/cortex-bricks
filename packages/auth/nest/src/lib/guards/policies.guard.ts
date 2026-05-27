import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { CHECK_POLICIES_KEY } from '../casl/check-policies.decorator';
import { AnyPolicyHandler, PolicyHandler } from '../casl/policy-handler';
import { User } from '../user/user.schema';

/**
 * Authorization guard that evaluates CASL policy handlers attached to a route.
 *
 * @example
 * ```ts
 * @UseGuards(PoliciesGuard)
 * ```
 */
@Injectable()
export class PoliciesGuard implements CanActivate {
  /**
   * Creates a policies guard with metadata and ability dependencies.
   *
   * @param reflector - Nest reflector used to read policy metadata.
   * @param abilityFactory - Factory that builds a CASL ability for the current user.
   * @example
   * ```ts
   * const guard = new PoliciesGuard(reflector, abilityFactory);
   * ```
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: CaslAbilityFactory,
  ) {}

  /**
   * Evaluates all policy handlers attached to the current route handler.
   *
   * @param context - Nest execution context for the current request.
   * @returns True when no handlers are present or all handlers allow the request.
   * @example
   * ```ts
   * const allowed = guard.canActivate(context);
   * ```
   */
  canActivate(context: ExecutionContext): boolean {
    const handlers = this.reflector.get<AnyPolicyHandler[]>(CHECK_POLICIES_KEY, context.getHandler()) ?? [];
    if (!handlers.length) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as User;
    const ability = this.abilityFactory.createForUser(user);

    return handlers.every((handler) => (typeof handler === 'function' ? handler(ability) : (handler as PolicyHandler).handle(ability)));
  }
}
