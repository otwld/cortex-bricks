# Cortex Backend App

Internal NestJS application used to exercise and compose Cortex Bricks backend
source packages during development.

## Responsibility

The app wires auth, users, mail, storage, AI, and websocket bricks into a real
runtime surface. It is a validation host for source-brick integration, not a
standalone published package.

## Development Checks

- `pnpm exec nx lint backend`
- `pnpm exec nx build backend`

