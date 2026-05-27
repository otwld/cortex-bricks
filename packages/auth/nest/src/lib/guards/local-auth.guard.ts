import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Nest guard that delegates local credential validation to Passport.
 *
 * @example
 * ```ts
 * @UseGuards(LocalAuthGuard)
 * ```
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
