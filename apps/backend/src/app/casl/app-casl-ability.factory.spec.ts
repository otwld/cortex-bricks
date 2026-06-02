import { AppCaslAbilityFactory } from './app-casl-ability.factory';
import { User } from '@otwld/nest-auth';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    _id: 'user-id' as any,
    email: 'test@example.com',
    emailVerified: false,
    roles: [],
    permissions: [],
    ...overrides,
  } as User;
}

describe('AppCaslAbilityFactory', () => {
  let factory: AppCaslAbilityFactory;

  beforeEach(() => {
    factory = new AppCaslAbilityFactory();
  });

  it('grants nothing for a user with no roles or permissions', () => {
    const ability = factory.createForUser(makeUser());
    expect(ability.can('read', 'Invoice')).toBe(false);
  });

  it('grants action from direct permissions', () => {
    const user = makeUser({ permissions: ['read:Invoice'] });
    const ability = factory.createForUser(user);
    expect(ability.can('read', 'Invoice')).toBe(true);
    expect(ability.can('write', 'Invoice')).toBe(false);
  });

  it('grants actions from role permissions', () => {
    const user = makeUser({ roles: [{ name: 'editor', permissions: ['write:Post'] }] });
    const ability = factory.createForUser(user);
    expect(ability.can('write', 'Post')).toBe(true);
    expect(ability.can('delete', 'Post')).toBe(false);
  });

  it('grants manage:all for wildcard permission', () => {
    const user = makeUser({ permissions: ['*'] });
    const ability = factory.createForUser(user);
    expect(ability.can('manage', 'all')).toBe(true);
  });

  it('grants manage:all for wildcard permission in a role', () => {
    const user = makeUser({ roles: [{ name: 'superadmin', permissions: ['*'] }] });
    const ability = factory.createForUser(user);
    expect(ability.can('manage', 'all')).toBe(true);
  });

  it('grants manage:all to configured bootstrap admin emails', () => {
    const bootstrapFactory = new (AppCaslAbilityFactory as any)({
      get: (key: string) => (key === 'adminEmails' ? ['ntrehout@otwld.com'] : undefined),
    });
    const user = makeUser({ email: 'NTREHOUT@otwld.com', permissions: [], roles: [] });

    const ability = bootstrapFactory.createForUser(user);

    expect(ability.can('manage', 'all')).toBe(true);
  });

  it('ignores malformed permission strings', () => {
    const user = makeUser({ permissions: ['invalid-no-colon'] });
    const ability = factory.createForUser(user);
    expect(ability.can('invalid-no-colon', 'anything')).toBe(false);
  });

  it('merges permissions from roles and direct permissions', () => {
    const user = makeUser({
      permissions: ['read:Invoice'],
      roles: [{ name: 'admin', permissions: ['write:Invoice'] }],
    });
    const ability = factory.createForUser(user);
    expect(ability.can('read', 'Invoice')).toBe(true);
    expect(ability.can('write', 'Invoice')).toBe(true);
  });
});
