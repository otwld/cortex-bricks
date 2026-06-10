# @otwld/ng-feature-flags

Angular feature-flag client, provider, route guard helpers, and UI integration
for Cortex Bricks feature-flag source bricks.

## Source-Brick Status

This package is source intended for inspection and future `bricks` CLI
consumption. It is not the primary compiled-package installation surface while
Cortex Bricks remains in prerelease.

## Public Surface

- `provideFeatureFlags` configures the Angular client.
- `FeatureFlagsService` evaluates app and user feature flags.
- Directives, pipes, and route helpers expose feature checks to templates and
  router configuration.

## Development Checks

- `pnpm exec nx lint ng-feature-flags`
- `pnpm exec nx test ng-feature-flags`
- `pnpm exec nx build ng-feature-flags`

