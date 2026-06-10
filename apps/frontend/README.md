# Cortex Frontend App

Internal Angular application used to exercise and compose Cortex Bricks frontend
source packages during development.

## Responsibility

The app validates Angular auth, dashboard, storage, AI, users, websocket, UI,
and shared CDK-style bricks together in a browser-facing runtime.

## Development Checks

- `pnpm exec nx lint frontend`
- `pnpm exec nx test frontend`
- `pnpm exec nx build frontend`

