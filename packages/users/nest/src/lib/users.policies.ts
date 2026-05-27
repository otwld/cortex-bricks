import { PolicyHandlerFn } from '@otwld/nest-auth';

/** Allows read access to dashboard-managed users. */
export const canReadUsers: PolicyHandlerFn = (ability) =>
  ability.can('read', 'User') || ability.can('manage', 'User') || ability.can('manage', 'all');

/** Allows mutation access to dashboard-managed users. */
export const canManageUsers: PolicyHandlerFn = (ability) => ability.can('manage', 'User') || ability.can('manage', 'all');
