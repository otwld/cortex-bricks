# @otwld/ts-chat

Framework-neutral chat contracts used by Cortex Bricks websocket examples.

## Source-Brick Status

This package is part of the Cortex Bricks source-brick workspace. Browse the
source to study the contract shape and copy/sync support through the separate
`bricks` CLI when that workflow is available.

## Public Surface

- `ChatContract` defines the demo chat websocket namespace and event contract.
- `ChatMessage` is the message payload broadcast by the demo gateway.

## Development Checks

- `pnpm exec nx build ts-chat`
- `pnpm exec nx typecheck ts-chat`
