import { CanActivate, ExecutionContext, Inject, Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { isObservable, lastValueFrom } from 'rxjs';
import { AI_ENDPOINT_OPTIONS, NormalizedAiEndpointOptions } from '../config/ai-module-options';
import { AiException } from '../exceptions/ai.exception';

/** Composes configured Nest guards around AI controller endpoints. */
@Injectable()
export class AiEndpointGuard implements CanActivate {
  /**
   * Create the AI endpoint guard.
   *
   * @param endpoints - Endpoint guard configuration from the AI module.
   * @param moduleRef - Nest module reference used to resolve configured guards.
   */
  constructor(
    @Inject(AI_ENDPOINT_OPTIONS) private readonly endpoints: Pick<NormalizedAiEndpointOptions, 'guards'>,
    private readonly moduleRef: ModuleRef,
  ) {}

  /** Execute configured endpoint guards in order for the current request. */
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
