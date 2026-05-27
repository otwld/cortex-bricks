# ng-auth

Angular client-side authentication library.

## Purpose

Use this library for browser auth concerns: auth pages, auth route bundles, auth guards, auth API clients, auth state, permission checks, and HTTP request integration.

An AI agent should look here when a task mentions Angular login UI, register UI, forgot-password pages, authenticated routes, guest-only routes, email-verification gates, auth HTTP interceptors, browser token/session state, CASL checks in Angular, or reusable auth form flows.

## What Belongs Here

- Angular auth route definitions and standalone auth pages.
- Client auth state services and browser-facing auth API services.
- Route guards for authenticated, guest, and verification-only access.
- HTTP interceptors that attach auth behavior to API calls.
- Angular permission helpers, pipes, and CASL ability state.
- Reusable auth form components, validators, and auth UX primitives.
- Auth configuration tokens and provider functions.

## What Does Not Belong Here

- NestJS controllers, JWT issuing, OAuth strategies, or token persistence. Use `packages/auth/nest`.
- Dashboard account-management pages that are not core auth flows. Use `packages/dashboard/ng`.
- Generic Angular component utilities. Use `packages/sdk/ng`.
- Product-specific copy, branding, or app-only route wiring.

## Current Entry Points

```ts
import { authRoutes } from '@otwld/ng-auth';
import { provideAuth, AuthService, AuthStateService } from '@otwld/ng-auth/core';
```

Feature folders under `packages/auth/ng/src/lib` are intended for auth route pages. Shared auth logic lives under `packages/auth/ng/core`.

## Development

```sh
npx nx build ng-auth
npx nx test ng-auth
npx nx lint ng-auth
npx tsc --project packages/auth/ng/tsconfig.lib.json --noEmit
```
