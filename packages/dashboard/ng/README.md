# ng-dashboard

Angular dashboard, application-shell, admin-page, and business UI library.

## Purpose

Use this library for reusable product UI that is larger than a primitive component: dashboard layouts, menus, app shells, admin pages, domain dashboards, data-heavy screens, and composed PrimeNG experiences.

An AI agent should look here when a task mentions dashboard navigation, sidebars, topbars, breadcrumbs, admin CRUD, ecommerce/admin pages, banking dashboards, mail/chat/task demo apps, user-management pages, PrimeNG demo pages, layout state, menu models, or dashboard data types.

## What Belongs Here

- Dashboard shell components and layout state services.
- Reusable admin/product pages and page route bundles.
- Composed feature screens built from Angular and PrimeNG components.
- Dashboard widgets, analytics cards, data tables, charts, menus, and page-level UI.
- Demo app experiences such as chat, mail, files, CMS, and tasklist when they are part of the dashboard surface.
- Dashboard-specific data services, mock/demo data adapters, and view model types.
- Secondary entry points for dashboard features, pages, apps, and UI kit examples.

## What Does Not Belong Here

- Low-level Angular utilities or primitive cross-app component helpers. Use `packages/sdk/ng`.
- Authentication flow pages or auth state. Use `packages/auth/ng`.
- Backend APIs, persistence, or NestJS modules.
- Product-specific one-off pages that cannot be reused across dashboard-style apps.
- Media storage, file upload backends, or object-storage integration.

## Current Entry Points

```ts
import { DashboardLayout } from '@otwld/ng-dashboard/layout';
import { DashboardLayoutService } from '@otwld/ng-dashboard/core';
```

Dashboard features are exposed through explicit secondary entry points instead
of source-shaped deep imports. Supported entry points currently include:

- `@otwld/ng-dashboard/core`
- `@otwld/ng-dashboard/layout`
- `@otwld/ng-dashboard/banking`
- `@otwld/ng-dashboard/ecommerce`
- `@otwld/ng-dashboard/apps`
- `@otwld/ng-dashboard/apps/ai`
- `@otwld/ng-dashboard/apps/chat`
- `@otwld/ng-dashboard/apps/cms`
- `@otwld/ng-dashboard/apps/files`
- `@otwld/ng-dashboard/apps/mail`
- `@otwld/ng-dashboard/apps/tasklist`
- `@otwld/ng-dashboard/pages/blocks`
- `@otwld/ng-dashboard/pages/contact-us`
- `@otwld/ng-dashboard/pages/crud`
- `@otwld/ng-dashboard/pages/ecommerce`
- `@otwld/ng-dashboard/pages/empty`
- `@otwld/ng-dashboard/pages/faq`
- `@otwld/ng-dashboard/pages/help`
- `@otwld/ng-dashboard/pages/invoice`
- `@otwld/ng-dashboard/pages/notfound`
- `@otwld/ng-dashboard/pages/user-management`
- `@otwld/ng-dashboard/uikit/buttons`
- `@otwld/ng-dashboard/uikit/chartdemo`
- `@otwld/ng-dashboard/uikit/filedemo`
- `@otwld/ng-dashboard/uikit/formlayoutdemo`
- `@otwld/ng-dashboard/uikit/inputdemo`
- `@otwld/ng-dashboard/uikit/listdemo`
- `@otwld/ng-dashboard/uikit/mediademo`
- `@otwld/ng-dashboard/uikit/menudemo`
- `@otwld/ng-dashboard/uikit/messagesdemo`
- `@otwld/ng-dashboard/uikit/miscdemo`
- `@otwld/ng-dashboard/uikit/overlaydemo`
- `@otwld/ng-dashboard/uikit/panelsdemo`
- `@otwld/ng-dashboard/uikit/tabledemo`
- `@otwld/ng-dashboard/uikit/timelinedemo`
- `@otwld/ng-dashboard/uikit/treedemo`

## Development

```sh
npx nx build ng-dashboard
npx nx test ng-dashboard
npx nx lint ng-dashboard
npx tsc --project packages/dashboard/ng/tsconfig.lib.json --noEmit
```
