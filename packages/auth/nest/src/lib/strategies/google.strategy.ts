import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AUTH_MODULE_OPTIONS, AuthModuleOptions } from '../config/auth-module-options';
import { UserService } from '../user/user.service';

/**
 * Resolves Google OAuth options or fails before Passport strategy setup.
 *
 * @param options - Auth module options that should include Google OAuth settings.
 * @returns Google OAuth configuration for Passport.
 */
function requireGoogleOptions(options: AuthModuleOptions): NonNullable<AuthModuleOptions['google']> {
  if (!options.google) {
    throw new Error('Google OAuth strategy requires AuthModuleOptions.google.');
  }
  return options.google;
}

/**
 * Passport strategy that authenticates users with Google OAuth.
 *
 * @example
 * ```ts
 * providers: [GoogleStrategy]
 * ```
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  /**
   * Creates a Google OAuth strategy from module options.
   *
   * @param options - Auth module options containing Google OAuth settings.
   * @param userService - User service used to find, link, or create accounts.
   * @example
   * ```ts
   * const strategy = new GoogleStrategy(options, userService);
   * ```
   */
  constructor(
    @Inject(AUTH_MODULE_OPTIONS) options: AuthModuleOptions,
    private readonly userService: UserService,
  ) {
    const google = requireGoogleOptions(options);
    super({
      clientID: google.clientId,
      clientSecret: google.clientSecret,
      callbackURL: google.callbackUrl,
      scope: ['email', 'profile'],
    });
  }

  /**
   * Resolves the application user for a validated Google profile.
   *
   * @param _accessToken - Google access token provided by Passport.
   * @param _refreshToken - Google refresh token provided by Passport when available.
   * @param profile - Google profile returned by the OAuth provider.
   * @returns The matched, linked, or newly created user document, or null when no email is available.
   * @example
   * ```ts
   * const user = await strategy.validate(accessToken, refreshToken, profile);
   * ```
   */
  async validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const email = profile.emails?.[0]?.value;
    if (!email) return null;

    let user = await this.userService.findByGoogleId(profile.id);
    if (!user) {
      user = await this.userService.findByEmail(email);
      if (user) {
        await this.userService['userRepository'].updateById(String(user._id), { googleId: profile.id, emailVerified: true });
        return this.userService.findById(String(user._id));
      }
      user = await this.userService.create({
        email,
        googleId: profile.id,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        avatar: profile.photos?.[0]?.value,
        emailVerified: true,
      });
    }
    return user;
  }
}
