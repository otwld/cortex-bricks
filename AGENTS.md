<!-- context7 -->
Use the `ctx7` CLI to fetch current documentation whenever the user asks about
a library, framework, SDK, API, CLI tool, or cloud service, even well-known ones
like React, Next.js, Prisma, Express, Tailwind, Django, or Spring Boot. This
includes API syntax, configuration, version migration, library-specific
debugging, setup instructions, and CLI tool usage. Use even when you think you
know the answer because training data may not reflect recent changes. Prefer
this over web search for library docs.

Do not use for refactoring, writing scripts from scratch, debugging business
logic, code review, or general programming concepts.

## Steps

1. Resolve library:
   `npx ctx7@latest library <name> "<user's question>"` - use the official
   library name with proper punctuation, for example `Next.js`, `Customer.io`,
   or `Three.js`.
2. Pick the best match, with ID format `/org/project`, by exact name match,
   description relevance, code snippet count, source reputation, and benchmark
   score. If results do not look right, try alternate names or rephrase the
   question.
3. Fetch docs:
   `npx ctx7@latest docs <libraryId> "<user's question>"`.
4. Answer using the fetched documentation.

You must call `library` first to get a valid ID unless the user provides one
directly in `/org/project` format. Use the user's full question as the query.
Specific queries return better results than vague single words. Do not run more
than 3 commands per question. Do not include sensitive information such as API
keys, passwords, or credentials in queries.

For version-specific docs, use `/org/project/version` from the `library` output,
for example `/vercel/next.js/v14.3.0`.

If a command fails with a quota error, inform the user and suggest
`npx ctx7@latest login` or setting `CONTEXT7_API_KEY` for higher limits. Do not
silently fall back to training data.

Run Context7 CLI requests outside Codex's default sandbox. If a Context7 CLI
command fails with DNS or network errors such as `ENOTFOUND`, host resolution
failures, or `fetch failed`, rerun it outside the sandbox instead of retrying
inside the sandbox.
<!-- context7 -->

# Cortex Bricks Agent Instructions

Cortex Bricks is a prerelease OTWLD source-brick repository for reusable
Angular, NestJS, framework-neutral TypeScript contract, and internal app source.

This repository contains bricks as source files. Do not describe it as a
compiled-package-first distribution. The upcoming `bricks` CLI lives in a
separate repository and will consume source-brick repositories like this one to
copy, paste, sync, and eventually three-way-merge source into user Nx monorepos.

## No Legacy Adapters, Migration Layers, Or Compatibility Shims

`Cortex Bricks` libraries, apps, and source bricks are still in heavy active
development and have no public production users yet.

Because of this:

- Do **not** implement backward-compatibility layers.
- Do **not** create legacy adapters, migration wrappers, compatibility shims, or
  transitional abstractions.
- Do **not** preserve outdated APIs, behaviors, naming, structures, or
  architecture "just in case".
- Do **not** optimize for upgrade paths between internal iterations.
- Do **not** introduce deprecation systems unless explicitly requested.

If the architecture, API, internal model, or brick structure needs to evolve,
evolve it directly and cleanly.

Prefer:

- rewriting over patching,
- simplification over preservation,
- removal over abstraction,
- consistency over compatibility.

Assume the codebase can be refactored aggressively at any time until the project
reaches real public adoption and stability.

## Package And Brick Boundaries

Keep changes in the package or brick that owns the responsibility:

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

Root documentation should explain the source-brick repository model. It should
make clear that browsing is supported now and CLI-based source consumption is
coming through the separate `bricks` CLI.

Do not make unsupported publication, compatibility, or stability claims in docs.
Do not present `@otwld/*` manifests as the primary public installation workflow
unless the user explicitly changes the release posture.

Prefer explicit package entry points over deep imports. When changing a reusable
library or brick, keep its public exports intentional and update the
package-level README when behavior, setup, or supported usage changes.

## Worktree Safety

The repository may contain unrelated local changes. Preserve user work:

- Do not revert changes you did not make unless explicitly asked.
- Keep task diffs scoped to the files needed for the request.
- If existing changes affect the task, work with them instead of resetting them.
