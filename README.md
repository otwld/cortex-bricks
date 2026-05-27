# Cortex

Cortex is OTWLD's prerelease workspace for reusable Angular and NestJS
building blocks used across software agency projects.

It collects internal-first libraries for application shells, backend modules,
shared contracts, client utilities, and product-facing UI surfaces. The project
is public-readable, but it is still evolving quickly and should be treated as an
active prerelease codebase rather than a stable platform contract.

## Status

Cortex does not have public production adoption yet. APIs, package boundaries,
module names, and internal architecture can change directly when a cleaner model
emerges.

That means the project favors:

- simple current architecture over compatibility layers;
- clear package boundaries over broad catch-all utilities;
- package-local documentation over a large root manual;
- direct refactors over migration shims before public stability.

## Workspace Shape

The workspace is organized around scoped packages and apps:

- Angular libraries for UI, dashboards, auth, users, storage, AI, websockets,
  and reusable client utilities.
- NestJS libraries for backend auth, users, storage, mail, AI, websockets,
  MongoDB/Mongoose infrastructure, and shared server utilities.
- TypeScript-first packages for DTOs, models, enums, validation contracts, and
  other framework-neutral types.
- Internal app surfaces used to exercise and compose the libraries.

Individual package publication status varies. Treat this repository and the
package-level READMEs as the source of truth for what is currently available and
how each package is intended to be used.

## Design Principles

Cortex libraries are expected to stay modular, focused, and explicit about their
runtime. Framework-neutral contracts belong in `ts-*` packages; Angular code
belongs in Angular packages; NestJS code belongs in NestJS packages; reusable
MongoDB infrastructure belongs in the Mongoose infrastructure package rather
than feature-specific modules.

The codebase is intentionally allowed to evolve without legacy adapters while it
is still prerelease. When an API or internal model is wrong, the preferred fix is
to replace it with the cleaner shape and update callers directly.

## Where To Start

Start with the package README closest to the capability you need. Root
documentation gives the workspace-level orientation; package documentation owns
runtime-specific setup, examples, and implementation details.
