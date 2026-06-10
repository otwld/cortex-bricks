# @otwld/ts-auth

Framework-neutral authentication contracts shared by Cortex Bricks Angular and
NestJS auth packages.

## Source-Brick Status

This package is source intended for inspection and future `bricks` CLI
consumption. It is not the primary compiled-package installation surface while
Cortex Bricks remains in prerelease.

## Public Surface

- Auth user identity and permission types.
- Auth request payload contracts used by client and server implementations.

## Development Checks

- `pnpm exec nx test ts-auth`
- `pnpm exec nx typecheck ts-auth`
- `pnpm exec nx build ts-auth`

