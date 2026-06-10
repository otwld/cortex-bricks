import { Inject, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AbilityBuilder, AnyAbility, createMongoAbility } from '@casl/ability';
import { CaslAbilityFactory, User } from '@otwld/nest-auth';

/**
 * Application-level CASL ability factory that translates user roles and
 * permissions into a CASL ability instance used by policy guards.
 *
 * Permission strings follow the `action:subject` format (e.g. `read:Invoice`).
 * The special value `*` expands to `manage:all`, granting unrestricted access.
 * Malformed strings (no colon, colon at start or end) are silently ignored.
 *
 * @example
 * ```ts
 * const ability = factory.createForUser(user);
 * if (ability.can('read', 'Invoice')) { ... }
 * ```
 */
@Injectable()
export class AppCaslAbilityFactory extends CaslAbilityFactory {
  constructor(@Optional() @Inject(ConfigService) private readonly config?: Pick<ConfigService, 'get'>) {
    super();
  }

  /**
   * Builds a CASL ability for the given user by merging direct permissions
   * with permissions inherited from the user's roles.
   *
   * @param user - Authenticated user whose roles and permissions are evaluated.
   * @returns A CASL ability instance reflecting all granted actions.
   */
  createForUser(user: User): AnyAbility {
    const { can, build } = new AbilityBuilder(createMongoAbility);

    if (this.isBootstrapAdmin(user.email)) {
      can('manage', 'all');
    }

    const allPermissions = [
      ...(user.permissions ?? []),
      ...(user.roles ?? []).flatMap((role) => role.permissions ?? []),
    ];

    for (const perm of allPermissions) {
      if (perm === '*') {
        can('manage', 'all');
        continue;
      }
      const colonIndex = perm.indexOf(':');
      // The first colon is the action/subject separator. Strings with no colon,
      // or with a colon only at the start/end, are silently skipped.
      if (colonIndex > 0 && colonIndex < perm.length - 1) {
        const action = perm.slice(0, colonIndex);
        const subject = perm.slice(colonIndex + 1);
        can(action, subject);
      }
    }

    return build();
  }

  private isBootstrapAdmin(email: string): boolean {
    const adminEmails = this.config?.get<string[] | string>('adminEmails') ?? [];
    const normalized = (Array.isArray(adminEmails) ? adminEmails : adminEmails.split(','))
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    return normalized.includes(email.toLowerCase());
  }
}
