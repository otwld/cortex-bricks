# @otwld/ts-feature-flags

Framework-neutral feature-flag models, evaluator contracts, condition metadata,
and DTO types shared by Angular and NestJS feature-flag bricks.

## Source-Brick Status

This package is source intended for inspection and future `bricks` CLI
consumption. It is not the primary compiled-package installation surface while
Cortex Bricks remains in prerelease.

## Public Surface

- Feature-flag definitions, scopes, variants, and evaluation result contracts.
- Condition metadata and context types for app and user evaluation.

## Development Checks

- `pnpm exec nx test ts-feature-flags`
- `pnpm exec nx typecheck ts-feature-flags`
- `pnpm exec nx build ts-feature-flags`

