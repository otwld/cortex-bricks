import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

/**
 * Nest guard that delegates GitHub OAuth requests to Passport.
 *
 * @example
 * ```ts
 * @UseGuards(GithubAuthGuard)
 * ```
 */
@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  /** Forwards OAuth state query params to Passport provider redirects. */
  override getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const state = request.query['state'];
    return state ? { state: String(state) } : undefined;
  }
}
