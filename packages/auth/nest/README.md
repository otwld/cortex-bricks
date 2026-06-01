# nest-auth

NestJS server-side authentication and upstream authorization policy library.

## Purpose

Use this library for backend auth concerns: identity, sessions/tokens, OAuth strategies, user auth data, password flows, route guards, and policy enforcement.

An AI agent should look here when a task mentions backend login, registration, refresh tokens, JWT cookies, OAuth callbacks, email verification, password reset, current-user decorators, public routes, roles, permissions, or CASL policy checks.

## What Belongs Here

- NestJS auth modules and dynamic module configuration.
- Auth controllers, services, guards, strategies, and decorators.
- JWT access and refresh token creation, validation, persistence, and revocation.
- User and role schemas/repositories used directly by authentication.
- Local username/password auth and OAuth provider integration.
- Backend password reset and email verification flows.
- Backend authorization helpers such as CASL ability factories and policy guards.
- Auth mail callback contracts, not concrete app-specific email templates.

## What Does Not Belong Here

- Angular auth pages, guards, interceptors, or browser auth state. Use `packages/auth/ng`.
- Generic MongoDB infrastructure unrelated to auth. Use `packages/databases/nest`.
- Concrete application-specific user profile screens or account settings pages.
- Concrete mail transport implementations. Use `packages/mail/nest`.
- Product-specific business permissions that are not part of reusable auth infrastructure.

## Current Entry Points

```ts
import { AuthModule } from '@otwld/nest-auth';
```

The package also exports auth services, guards, decorators, CASL helpers, config types, and user schema/service types from `src/index.ts`.

## Development

```sh
npx nx test nest-auth
npx tsc --project packages/auth/nest/tsconfig.lib.json --noEmit
```
