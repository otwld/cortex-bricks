import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key indicating that a route should skip JWT authentication.
 *
 * @example
 * ```ts
 * reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [handler, controller]);
 * ```
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a controller or route handler as publicly accessible.
 *
 * @returns Nest metadata decorator that sets the public-route flag.
 * @example
 * ```ts
 * @Public()
 * @Get('health')
 * health() {
 *   return 'ok';
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
