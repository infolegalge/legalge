# Specialist Dashboard Rules

## Access
- **Role:** `SPECIALIST`
- **Scope:** personal profile, their own posts, and company context if assigned.
- **States:** active (can edit), pending (awaiting approval), suspended (read-only, no new posts).

## Dashboard Navigation (current implementation)
- Posts (`/${locale}/specialist/posts`)
- Profile (`/${locale}/specialist/profile` comprehensive editor)
- Requests (if company-linked)
- Media (future)
- Back to Site

## Overview
- KPIs: total posts, published, drafts, views, avg read time.
- Activity feed: recent edits, company approvals, profile updates.
- Quick actions: Create post, Update profile, View company guidelines.
- Alerts: awaiting company approval, profile incomplete, suspension notices.

## Posts
- **UI:** `SpecialistPostsManagement` (similar to company but scoped to author).
- **Create/Edit:** `NewPostForm` and `SpecialistEditPostForm` use RichEditor with KA/EN/RU tabs, status toggle, categories (global only), cover upload.
- **API integration:**
  - Create via `POST /api/posts` payload `{ scope: 'specialist', authorType: 'SPECIALIST' }`.
  - Edits via `PATCH /api/posts/:id?scope=specialist` respecting role guardrails in API.
- **Guardrails:**
  - Specialist sees only own posts.
  - Publish requires cover image + KA content.
  - Posts automatically link to company if `User.companyId` present.

## Profile
- **Editors:** `ComprehensiveSpecialistEditor` (full profile) and `MultiLanguageSpecialistEditor` with RichEditor fields for enhanced info (philosophy, focus areas, matters, credentials, values).
- **API:** `GET/PATCH /api/specialist/profile` ignores `contactEmail`/`contactPhone` to keep secure.
- **Workflow:** Submit changes (stored or sent as change requests to super admin/company).
- **Company integration:** When approved via company requests, specialist profile’s `companyId` is set and email locked to account email.

## Requests (if company-based)
- Specialists submit join requests; status visible after submission (UI integration WIP).
- Accept/decline company invitations handled via requests API.

## Media
- Personal uploads for posts (images, inline media).
- Manage: upload, delete, view usage (posts referencing the media).

## Settings
- Notification preferences, password/security, language locale.
- Suspension: read-only explanation and appeal instructions.

## Permissions Summary
- Posts: create/edit own ✓; edit others ✗; delete own ✓; archive own ✓.
- Profile: edit ✓ (company email locked).
- Media: manage own ✓.
- Company context: must follow company policies.

## API Highlights (specialist-facing)
- `GET /api/specialist/profile`
- `PATCH /api/specialist/profile`
- `GET /api/specialist/posts`
- `POST /api/posts?scope=specialist`
- `PATCH /api/posts/:id?scope=specialist`
- `GET /api/specialist/media`


