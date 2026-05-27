# nest-mail

NestJS email and notification-delivery library.

## Purpose

Use this library for server-side outbound email concerns: mail module setup, typed templates, template rendering, delivery transports, preview delivery, attachments, and mail-provider integration.

An AI agent should look here when a task mentions sending email, transactional mail, SMTP, Postal, Mailpit, Maizzle templates, template context typing, rendered HTML email, mail attachments, or reusable NestJS mail configuration.

## What Belongs Here

- NestJS mail modules, services, configuration types, and provider tokens.
- Mail transport interfaces and transport implementations.
- Template loading, interpolation, rendering helpers, and template context typing.
- Raw email and templated email send APIs.
- Preview/local mail delivery tools.
- Attachment abstractions used by outbound email.
- Provider-neutral mail contracts that apps and auth packages can call.

## What Does Not Belong Here

- Concrete app email templates and copy. App templates currently live under `apps/backend/mail`.
- Auth business rules that decide when to send an email. Use `packages/auth/nest`.
- Background queue infrastructure unless it is mail-delivery specific and reusable.
- Browser notification UI.
- Media/file storage that is not an email attachment abstraction.

## Current Entry Points

```ts
import { MailModule, MailService, PostalTransport, PreviewTransport, SmtpTransport } from '@otwld/nest-mail';
```

Use `MailTemplateMap` module augmentation in consuming apps to make template contexts type-safe.

## Development

```sh
npx nx test nest-mail
npx tsc --project packages/mail/nest/tsconfig.lib.json --noEmit
```
