import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { AUTH_MODULE_OPTIONS } from '../config/auth-module-options';
import { AuthModuleOptions } from '../config/auth-module-options';
import { JwtPayload } from '../tokens/token.service';
import { UserService } from '../user/user.service';

/**
 * Passport JWT strategy that authenticates requests from the access token cookie.
 *
 * @example
 * ```ts
 * providers: [JwtStrategy]
 * ```
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  /**
   * Creates a JWT strategy with the configured access-token secret.
   *
   * @param options - Auth module options containing the access JWT secret.
   * @param userService - User service used to resolve the token subject.
   * @example
   * ```ts
   * const strategy = new JwtStrategy(options, userService);
   * ```
   */
  constructor(
    @Inject(AUTH_MODULE_OPTIONS) options: AuthModuleOptions,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: (req: Request) => req?.cookies?.['access_token'] ?? null,
      ignoreExpiration: false,
      secretOrKey: options.jwtSecret,
    });
  }

  /**
   * Resolves the current user from a verified JWT payload.
   *
   * @param payload - Verified JWT payload supplied by Passport.
   * @returns The matching user document.
   * @throws UnauthorizedException When the token subject does not map to a user.
   * @example
   * ```ts
   * const user = await strategy.validate({ sub: userId, email });
   * ```
   */
  async validate(payload: JwtPayload) {
    const user = await this.userService.findById(payload.sub);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
