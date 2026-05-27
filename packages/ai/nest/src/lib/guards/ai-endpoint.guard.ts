import { CanActivate, ExecutionContext, Inject, Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { isObservable, lastValueFrom } from 'rxjs';
import { AI_ENDPOINT_OPTIONS, NormalizedAiEndpointOptions } from '../config/ai-module-options';
import { AiException } from '../exceptions/ai.exception';

/**
 * Provides ai endpoint guard behavior.
 */
@Injectable()
export class AiEndpointGuard implements CanActivate {
  /**
   * Creates a ai endpoint guard instance.
   *
   * @param endpoints - endpoints value.
   *
   * @param moduleRef - module ref value.
   */
  constructor(
    @Inject(AI_ENDPOINT_OPTIONS) private readonly endpoints: Pick<NormalizedAiEndpointOptions, 'guards'>,
    private readonly moduleRef: ModuleRef,
  ) {}

  /**
   * Runs can activate.
   *
   * @param context - context value.
   *
   * @returns The ai endpoint guard can activate result.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    for (const guardType of this.endpoints.guards ?? []) {
      const guard = this.resolveGuard(guardType.name, guardType);
      const result = guard.canActivate(context);
      const allowed = isObservable(result) ? await lastValueFrom(result) : await result;

      if (!allowed) return false;
    }

    return true;
  }

  private resolveGuard(name: string, guardType: Type<CanActivate>): CanActivate {
    try {
      return this.moduleRef.get(guardType, { strict: false });
    } catch (error) {
      throw AiException.misconfigured(`AI endpoint guard "${name}" is not available in the Nest container`, error);
    }
  }
}
