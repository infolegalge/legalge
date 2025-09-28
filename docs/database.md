# Database Guidelines

## General Principles
- Use **Prisma ORM** for all DB access.
- Schema defined in `prisma/schema.prisma`; migrations tracked under `prisma/migrations`.
- Prefer relation helpers (`connect`, `create`, `set`, `disconnect`) over manual FK updates.
- Use soft-delete/status flags where possible; log destructive actions in `AuditLog`.

## Core Models
- `User` – base account, role enum, status, company relation, auth fields.
- `Company` – organisation details, status, profile sections.
- `SpecialistProfile` – extended info (bio, languages, values, translations).
- `Post` – base content (title, slug, excerpt, body, status, locale, readingTime, viewCount).
- `PostTranslation` – localized title/slug/excerpt/body/meta.
- `Category`, `CategoryTranslation`, `PostCategory` (junction).
- `MediaAsset` – uploaded files metadata.
- `AuditLog` – actor, action, target, payload diff.

## Slugs & Locales
- Base slug stored in `Post.slug` (KA).
- Localized slugs stored in `PostTranslation.slug` with unique constraint per locale.
- Always ensure unique slug before create/update (loop until unique).
- Locale switch relies on `/api/slugs/services` and `/api/slugs/news` resolvers.

## Relations & Cascades
- `Post` → `Company`: optional relation; connect via `company: { connect: { id } }`.
- `Post` → `User` author: connect by user id.
- Categories: use nested writes `categories: { create: [{ categoryId }] }`.
- Specialist ↔ Company: `SpecialistProfile.companyId` (nullable); maintain historical attribution.

## Status & Suspension
- Posts `status`: `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- Company/specialist suspension flags should be respected before writes.

## Analytics Fields
- `Post` holds `viewCount`, `readingTime` (int). Additional analytics tables TBD.

## Auditing
- Write to `AuditLog` on publish, approval, suspension, destructive actions.
- Include actor id, role, target entity, diff.

## Migrations Workflow
- `prisma migrate dev --name <change>` during development.
- Keep migrations atomic and descriptive.
- Run `prisma generate` after schema changes.

## Data Integrity Tips
- Store arrays in JSON columns where possible; when stored as strings (legacy), `JSON.stringify`/`parse` consistently.
- Use Prisma transactions for multi-step operations (e.g., posts with translations and categories).
- Validate existence before connect to avoid runtime errors.


