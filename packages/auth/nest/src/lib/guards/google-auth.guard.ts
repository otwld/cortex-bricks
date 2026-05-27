import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

/**
 * Nest guard that delegates Google OAuth requests to Passport.
 *
 * @example
 * ```ts
 * @UseGuards(GoogleAuthGuard)
 * ```
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  /** Forwards OAuth state query params to Passport provider redirects. */
  /**
   * Runs get authenticate options.
   *
   * @param context - context value.
   *
   * @returns The google auth guard get authenticate options result.
   */
  override getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const state = request.query['state'];
    return state ? { state: String(state) } : undefined;
  }
}
