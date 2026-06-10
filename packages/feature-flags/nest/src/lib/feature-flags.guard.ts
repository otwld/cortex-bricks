import { CanActivate, ExecutionContext, Inject, Injectable, InternalServerErrorException, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { FeatureFlagsService } from './feature-flags.service';
import { FEATURE_FLAGS_CONTEXT_RESOLVER_TOKEN, FeatureFlagsContextResolver } from './feature-flags.tokens';
import { FEATURE_FLAG_REQUIREMENT_KEY, FeatureFlagRequirement } from './feature-flags.decorators';

/**
 * Guard that enforces the @RequireFeatureFlag metadata.
 */
@Injectable()
export class FeatureFlagsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly service: FeatureFlagsService,
    @Optional() @Inject(FEATURE_FLAGS_CONTEXT_RESOLVER_TOKEN) private readonly contextResolver?: FeatureFlagsContextResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<FeatureFlagRequirement>(FEATURE_FLAG_REQUIREMENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requirement) return true;

    if (!this.contextResolver) {
      throw new InternalServerErrorException(
        'FeatureFlagsGuard requires a FeatureFlagsContextResolver provider to resolve request context.',
      );
    }

    const request = context.switchToHttp().getRequest<Request & { featureFlagPayloads?: Record<string, unknown> }>();
    const featureContext =
      requirement.scope === 'app'
        ? await this.contextResolver.resolveAppContext(request)
        : await this.contextResolver.resolveUserContext(request);

    const evaluation = await this.service.evaluateFeatureForContext(requirement.name, featureContext);
    if (!evaluation.enabled) return false;

    request.featureFlagPayloads ??= {};
    request.featureFlagPayloads[requirement.name] = evaluation.payload;

    return true;
  }
}
