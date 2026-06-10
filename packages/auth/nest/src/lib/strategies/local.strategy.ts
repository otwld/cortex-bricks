import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserService } from '../user/user.service';

/** Minimal user-service surface required by local credential validation. */
type LocalCredentialsUserService = Pick<
  UserService,
  'findByEmailOrUsernameWithPassword' | 'validatePassword'
>;

/**
 * Passport local strategy that validates email/username and password credentials.
 *
 * @example
 * ```ts
 * providers: [LocalStrategy]
 * ```
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  /**
   * Creates a local strategy using email as the username field.
   *
   * @param userService - User service used to load users and validate password hashes.
   * @example
   * ```ts
   * const strategy = new LocalStrategy(userService);
   * ```
   */
  constructor(
    @Inject(UserService) private readonly userService: LocalCredentialsUserService,
  ) {
    super({ usernameField: 'email' });
  }

  /**
   * Validates local credentials and returns the matching user.
   *
   * @param identifier - Email address or username submitted through the local username field.
   * @param password - Plain-text password submitted by the user.
   * @returns The authenticated user document.
   * @throws UnauthorizedException When the email or password is invalid.
   * @example
   * ```ts
   * const user = await strategy.validate('user@example.com', 'secret');
   * ```
   */
  async validate(identifier: string, password: string) {
    const user = await this.userService.findByEmailOrUsernameWithPassword(identifier);
    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials');
    const valid = await this.userService.validatePassword(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return user;
  }
}
