# nest-mongoose

NestJS MongoDB and Mongoose infrastructure library.

## Purpose

Use this library for reusable backend persistence infrastructure built on MongoDB and Mongoose: connection setup, shared schema helpers, repository primitives, transactions, pagination, query utilities, and database module conventions.

An AI agent should look here when a task mentions NestJS MongoDB setup, Mongoose module wiring, database connection reuse, shared repository patterns, schema plugins, Mongo transactions, object IDs, pagination helpers, or common persistence utilities.

## What Belongs Here

- Reusable NestJS modules for MongoDB/Mongoose setup.
- Shared Mongoose schema helpers, plugins, and conventions.
- Generic repository base classes or persistence helpers.
- Mongo query, pagination, sorting, and filtering utilities.
- Transaction/session helpers.
- Database testing utilities that are reusable across backend packages.

## What Does Not Belong Here

- Auth-specific user, role, or refresh-token persistence. Use `packages/auth/nest`.
- Product-specific schemas and repositories.
- Non-Mongo storage such as object storage, media storage, or Redis.
- Frontend data services.

## Current Entry Points

```ts
import { NestMongooseModule } from '@otwld/nest-mongoose';
```

## Development

```sh
npx nx test nest-mongoose
npx tsc --project packages/databases/nest/tsconfig.lib.json --noEmit
```
