import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT guard that skips Passport authentication for handlers marked public.
 *
 * @example
 * ```ts
 * @UseGuards(JwtAuthGuard)
 * ```
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Creates a JWT auth guard with access to route metadata.
   *
   * @param reflector - Nest reflector used to read public route metadata.
   * @example
   * ```ts
   * const guard = new JwtAuthGuard(reflector);
   * ```
   */
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * Allows public routes or delegates protected routes to the JWT passport guard.
   *
   * @param context - Nest execution context for the current request.
   * @returns True for public routes or the delegated Passport activation result.
   * @example
   * ```ts
   * const allowed = guard.canActivate(context);
   * ```
   */
  override canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
