# documentation

Storybook host for browsing the reusable Cortex source bricks.

## Build

Run `nx build documentation` to build the static documentation site.

## Development

Run `nx storybook documentation` to start the development server.

## Interaction Tests

Run `nx run documentation:test-storybook --configuration=ci` to build, serve,
and test the static Storybook site.

The committed `public/mockServiceWorker.js` asset is served through Storybook's
`staticDirs` configuration so MSW-backed stories also work in static builds and
interaction tests. Regenerate it with
`pnpm exec msw init apps/documentation/public --save` after upgrading MSW.
