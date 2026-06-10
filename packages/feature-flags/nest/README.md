# @otwld/nest-feature-flags

NestJS feature-flag module, service, REST controller, GraphQL resolver, and
MongoDB persistence for Cortex Bricks feature-flag source bricks.

## Source-Brick Status

This package is source intended for inspection and future `bricks` CLI
consumption. It is not the primary compiled-package installation surface while
Cortex Bricks remains in prerelease.

## Public Surface

- `FeatureFlagsModule` wires feature-flag services, persistence, and transport
  adapters.
- Feature-flag DTOs, decorators, guard, tokens, and utility contracts support
  NestJS REST and GraphQL integration.

## Development Checks

- `pnpm exec nx lint nest-feature-flags`
- `pnpm exec nx test nest-feature-flags`
- `pnpm exec nx build nest-feature-flags`

