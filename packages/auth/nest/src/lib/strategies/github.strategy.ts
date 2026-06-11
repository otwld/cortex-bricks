import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';
import { AUTH_MODULE_OPTIONS, AuthModuleOptions } from '../config/auth-module-options';
import { AuthAccountService } from '../auth-account/auth-account.service';

/**
 * Resolves GitHub OAuth options or fails before Passport strategy setup.
 *
 * @param options - Auth module options that should include GitHub OAuth settings.
 * @returns GitHub OAuth configuration for Passport.
 */
function requireGithubOptions(options: AuthModuleOptions): NonNullable<AuthModuleOptions['github']> {
  if (!options.github) {
    throw new Error('GitHub OAuth strategy requires AuthModuleOptions.github.');
  }
  return options.github;
}

/**
 * Passport strategy that authenticates users with GitHub OAuth.
 *
 * @example
 * ```ts
 * providers: [GithubStrategy]
 * ```
 */
@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  /**
   * Creates a GitHub OAuth strategy from module options.
   *
   * @param options - Auth module options containing GitHub OAuth settings.
   * @param userService - AuthAccount service used to find, link, or create accounts.
   * @example
   * ```ts
   * const strategy = new GithubStrategy(options, userService);
   * ```
   */
  constructor(
    @Inject(AUTH_MODULE_OPTIONS) options: AuthModuleOptions,
    private readonly userService: AuthAccountService,
  ) {
    const github = requireGithubOptions(options);
    super({
      clientID: github.clientId,
      clientSecret: github.clientSecret,
      callbackURL: github.callbackUrl,
      scope: ['user:email'],
    });
  }

  /**
   * Resolves the application user for a validated GitHub profile.
   *
   * @param _accessToken - GitHub access token provided by Passport.
   * @param _refreshToken - GitHub refresh token provided by Passport when available.
   * @param profile - GitHub profile returned by the OAuth provider.
   * @returns The matched, linked, or newly created user document, or null when no email is available.
   * @example
   * ```ts
   * const user = await strategy.validate(accessToken, refreshToken, profile);
   * ```
   */
  async validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const email = (
      profile.emails as
        | Array<{
            /**
             * Email address value returned by GitHub.
             *
             * @example
             * ```ts
             * email.value = 'user@example.com';
             * ```
             */
            value: string;
          }>
        | undefined
    )?.[0]?.value;
    if (!email) return null;

    let user = await this.userService.findByGithubId(profile.id);
    if (!user) {
      user = await this.userService.findByEmail(email);
      if (user) {
        await this.userService.updateAssignments(String(user._id), { githubId: profile.id });
        return this.userService.findById(String(user._id));
      }
      user = await this.userService.create({
        email,
        githubId: profile.id,
        firstName: profile.displayName?.split(' ')[0],
        lastName: profile.displayName?.split(' ').slice(1).join(' ') || undefined,
        avatar: (
          profile.photos as
            | Array<{
                /**
                 * Profile photo URL returned by GitHub.
                 *
                 * @example
                 * ```ts
                 * photo.value = 'https://avatars.githubusercontent.com/u/1';
                 * ```
                 */
                value: string;
              }>
            | undefined
        )?.[0]?.value,
      });
    }
    return user;
  }
}
