# nest-sdk

Shared NestJS backend SDK and cross-cutting server utilities library.

## Purpose

Use this library for reusable NestJS building blocks that are not owned by a narrower package: common modules, decorators, interceptors, filters, pipes, error contracts, API response helpers, request context, logging helpers, and server-side integration primitives.

An AI agent should look here when a task mentions a backend utility that should be reused by multiple NestJS packages but is not specifically auth, mail, or MongoDB.

## What Belongs Here

- Generic NestJS decorators, guards, interceptors, pipes, and filters.
- Shared API response and error contracts.
- Request context, correlation ID, logging, and tracing helpers.
- Generic module/provider utilities.
- Backend validation and serialization helpers.
- Cross-package constants and types for NestJS services.

## What Does Not Belong Here

- Authentication-specific backend code. Use `packages/auth/nest`.
- Email-specific backend code. Use `packages/mail/nest`.
- MongoDB/Mongoose-specific infrastructure. Use `packages/databases/nest`.
- Angular/browser utilities. Use `packages/sdk/ng`.
- Product-specific business logic.

## Current Entry Points

```ts
import { NestSdkModule } from '@otwld/nest-sdk';
```

## Development

```sh
npx nx test nest-sdk
npx tsc --project packages/sdk/nest/tsconfig.lib.json --noEmit
```
