import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Parameter decorator that returns the Passport user stored on the request.
 *
 * @param _data - Unused decorator data supplied by Nest.
 * @param ctx - Execution context for the current request.
 * @returns The current request user.
 * @example
 * ```ts
 * getMe(@CurrentUser() user: UserDocument) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return request.user;
});
