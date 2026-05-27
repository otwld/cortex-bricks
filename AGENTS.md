# Cortex Agent Instructions

Cortex is a prerelease OTWLD workspace for reusable Angular, NestJS,
framework-neutral TypeScript contract, and internal app packages.

## No Legacy Adapters, Migration Layers, Or Compatibility Shims

`Cortex` libraries and apps are still in heavy active development and have no
public production users yet.

Because of this:

- Do **not** implement backward-compatibility layers.
- Do **not** create legacy adapters, migration wrappers, compatibility shims, or
  transitional abstractions.
- Do **not** preserve outdated APIs, behaviors, naming, structures, or
  architecture "just in case".
- Do **not** optimize for upgrade paths between internal iterations.
- Do **not** introduce deprecation systems unless explicitly requested.

If the architecture, API, or internal model needs to evolve, evolve it directly
and cleanly.

Prefer:

- rewriting over patching,
- simplification over preservation,
- removal over abstraction,
- consistency over compatibility.

Assume the codebase can be refactored aggressively at any time until the project
reaches real public adoption and stability.

## Package Boundaries

Keep changes in the package that owns the responsibility:

- Framework-neutral DTOs, models, enums, and contracts belong in `ts-*`
  packages.
- Angular components, directives, pipes, providers, and browser services belong
  in Angular packages.
- NestJS modules, controllers, providers, guards, pipes, and backend services
  belong in NestJS packages.
- Reusable MongoDB and Mongoose infrastructure belongs in the Mongoose
  infrastructure package, not in feature packages.
- Product-specific behavior should stay with the feature or app that owns it.

Do not create dumping-ground utilities. Extract shared code only when multiple
real consumers need the same behavior and the destination package has a clear
ownership reason.

## Public Surface And Documentation

Prefer explicit package entry points over deep imports. When changing a reusable
library, keep its public exports intentional and update the package-level README
when behavior, setup, or supported usage changes.

Do not make unsupported publication, compatibility, or stability claims in docs.
Root documentation should describe the workspace; package documentation should
own package-specific usage.

## Worktree Safety

The repository may contain unrelated local changes. Preserve user work:

- Do not revert changes you did not make unless explicitly asked.
- Keep task diffs scoped to the files needed for the request.
- If existing changes affect the task, work with them instead of resetting them.
