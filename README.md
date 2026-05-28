![otwld cortex bricks banner](./banner.png)

![GitHub License](https://img.shields.io/github/license/otwld/cortex-bricks)
[![Discord](https://img.shields.io/badge/Discord-OTWLD-blue?logo=discord&logoColor=white)](https://discord.otwld.com)

# Cortex Bricks

Cortex Bricks is a public preview source-brick repository for Angular, NestJS,
and framework-neutral TypeScript building blocks used in Nx monorepos.
It is maintained by OTWLD.

This repository contains source files, project structure, package boundaries,
and implementation patterns that are meant to become consumable by the upcoming
`bricks` CLI. It is not primarily a compiled npm package distribution.

## Public Preview

Cortex Bricks is currently at `v0.1.0` preview status. The source is public so
Nx app builders can inspect the bricks, follow the architecture, and watch the
ecosystem take shape.

For now, the supported external workflow is:

- browse the source;
- study the package boundaries and implementation patterns;
- star or watch the repository for the `bricks` CLI launch.

Manual source copying is not the supported path yet. APIs, folder boundaries,
brick names, and internal implementation details may change while the project is
still in preview.

## Coming Soon: `bricks` CLI

We are building a separate CLI named `bricks`.

The CLI will consume source-brick repositories like this one and bring selected
bricks into your own Nx monorepo. The goal is source ownership instead of black
box package consumption: copy the files you need, keep them in your repo, and
sync improvements when it makes sense.

Planned workflow:

- discover source bricks from repositories such as Cortex Bricks;
- copy or paste selected source files into an Nx workspace;
- sync source changes over time;
- support three-way merge flows for local edits and upstream updates.

The CLI is in active development and will be shared as soon as the first
external workflow is ready.

## What Is In This Repository

Cortex Bricks is organized as an Nx workspace with source bricks grouped by
runtime and domain:

- Angular bricks for UI, dashboard surfaces, auth, users, storage, AI,
  websockets, and client utilities.
- NestJS bricks for backend auth, users, storage, mail, AI, websockets,
  MongoDB/Mongoose infrastructure, and server utilities.
- TypeScript bricks for framework-neutral DTOs, models, enums, validation
  contracts, and shared type surfaces.
- Internal app surfaces used to exercise and compose the bricks during
  development.

Some packages have local package manifests because the workspace uses normal Nx,
TypeScript, Angular, and NestJS tooling. Treat those manifests as part of the
source-brick development environment, not as the primary public consumption
model.

## Design Principles

Cortex Bricks favors direct, readable source over compatibility layers. The
project is still early, so cleaner architecture wins over preserving old shapes.

The main boundaries are:

- framework-neutral contracts belong in `ts-*` packages;
- Angular components, directives, pipes, providers, and browser services belong
  in Angular packages;
- NestJS modules, controllers, providers, guards, pipes, and backend services
  belong in NestJS packages;
- reusable MongoDB and Mongoose infrastructure belongs in the database
  infrastructure package rather than feature packages.

The repository should stay modular. Shared code should have a clear owner and a
real consumer, not become a dumping ground for generic utilities.

## Where To Start

Start by browsing the package closest to the capability you care about. The root
README explains the repository model; package-level READMEs explain local
responsibility and current usage where that documentation exists.

Good first areas to inspect:

- `packages/ai` for AI contracts, Angular helpers, and NestJS integration;
- `packages/auth` for authentication source bricks;
- `packages/storage` for storage contracts and runtime integrations;
- `packages/users` for user-management bricks;
- `packages/websocket` for realtime contracts and runtime integrations;
- `packages/dashboard` for Angular dashboard and UI surfaces.

## License

Cortex Bricks is released under the MIT license. See `LICENSE`.
