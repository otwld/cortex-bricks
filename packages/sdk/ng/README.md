# ng-cdk

Shared Angular CDK-style foundation library for reusable frontend primitives.

## Purpose

Use this library for low-level Angular utilities that help build components and app features without tying them to one product surface: component behavior primitives, accessibility helpers, layout utilities, theme state, browser storage, media/file helpers, DOM utilities, signals utilities, directives, and provider patterns.

An AI agent should look here when a task mentions reusable Angular component infrastructure, dark mode, theme state, local/session storage, media handling, upload helpers, drag/drop primitives, keyboard interaction, focus management, ARIA helpers, viewport/layout helpers, reusable directives, or signal-based UI state utilities.

## What Belongs Here

- Generic Angular services, directives, pipes, and provider functions.
- Component-development primitives such as focus, keyboard, overlay, sizing, viewport, and DOM helpers.
- Accessibility utilities and ARIA behavior helpers.
- Theme and dark-mode state that can be shared by auth, landing, and dashboard surfaces.
- Browser storage abstractions for local storage, session storage, and persisted signal state.
- Media and file primitives such as file selection helpers, preview helpers, upload state models, object URL handling, image metadata helpers, and reusable validators.
- Signal, RxJS, forms, and Angular platform utilities intended for use across multiple frontend packages.

## What Does Not Belong Here

- Dashboard pages, app shells, widgets, and composed PrimeNG screens. Use `packages/dashboard/ng`.
- Auth pages, auth route guards, and auth HTTP interceptors. Use `packages/auth/ng`.
- Backend media storage, object-storage buckets, or database persistence.
- Product-specific UI that is not a reusable primitive.
- Concrete brand styling or app-only layout decisions.

## Current Entry Points

```ts
import { provideDarkMode, DarkModeService } from '@otwld/ng-cdk';
```

Current implemented areas include dark-mode provider/service/types and the generated `ng-cdk` component. Future shared Angular primitives should be organized under `src/lib/<area>` and exported from `src/index.ts` when they are public.

## Development

```sh
npx nx build ng-cdk
npx nx test ng-cdk
npx nx lint ng-cdk
npx tsc --project packages/sdk/ng/tsconfig.lib.json --noEmit
```
