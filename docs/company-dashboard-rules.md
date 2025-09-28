# Company Dashboard Rules & Scope

## Access Control
- **Role:** `COMPANY`
- **Requirements:** account active (not suspended)
- **Data scope:** company’s own organisation and its specialists only; no cross-company access.

## Top-Level Navigation (current implementation)
- Overview
- Manage Specialists
- Posts
- Categories
- Requests
- Analytics
- Company Profile
- Back to Site (locale aware)

## Overview Page
- **KPIs:** total posts, published posts, drafts, total views, average read time.
- **Activity feed:** latest post edits, new specialist joins, approvals.
- **Quick actions:** New post, Invite specialist, Review pending requests.
- **Alerts:** suspension risks, missing profile fields, outstanding requests.

## Posts (Company Post Management module)
- **Sources displayed:**
  - Posts authored by the company account itself.
  - Posts authored by any specialist whose `User.companyId` or `SpecialistProfile.companyId` matches the company.
  - Posts whose `Post.companyId` equals the current company.
- **API:** `GET /api/posts?scope=company&locale=<loc>[&companySlug=<slug>]`
  - Resolves companyId from session; falls back to DB lookup; includes translations for active locale.
  - No implicit status filter; shows draft + published unless `status=` query provided.
  - Includes `debug` payload in non-production to aid QA.
- **List fields:** title (locale aware), status badge, excerpt, published date, author chip (`Company` or `Specialist • Company`), category count.
- **Actions:**
  - Create (`/${locale}/company/posts/new`) → RichEditor with KA/EN/RU tabs, category checkboxes, cover upload.
  - Edit (`/${locale}/company/posts/[id]/edit`) → same UI; posts can be published/unpublished.
  - Delete (soft delete planned; currently hard delete via API `DELETE /api/posts/:id?scope=company`).
- **Category support:** posts read company + global categories via `GET /api/company/categories?includeGlobal=true&postId=<id>`.
- **Guardrails:** company users may edit specialists’ posts but cannot change author; future archive/restore planned.

## Manage Specialists
- **UI:** `/${locale}/company/lawyers` renders `CompanyLawyersManagement` client component.
- **API:** `GET /api/company/specialists`
  - Resolves companyId from session → DB fallback → company slug.
  - Returns specialists (active + pending) with services, languages, company info.
- **Capabilities:**
  - Search by name/role/specialization.
  - View profile, edit via `/company/lawyers/[id]/edit` (uses `SpecialistEditForm` with RichEditor, service selector, translations preview).
  - Deactivate specialist (`PATCH /api/specialists/:id/status` → `{ status: 'INACTIVE' }`).
- **Approval flow:** `PATCH /api/company/requests/:id` (status=`APPROVED`) now:
  - Promotes user role → `SPECIALIST`.
  - Sets `User.companyId` & `SpecialistProfile.companyId` to the approving company.
  - Creates profile if missing with unique slug.
- **UI copy:** email/phone, company chip, unsaved changes badge.
- **Guardrails:** list only contains specialists whose `companyId` matches current company.

## Categories (Company scope)
- **UI:** `/company/categories` with search, stats, create panel, and list.
- **API:**
  - `GET /api/company/categories?includeGlobal=true` → returns company + global categories with post counts + translations.
  - `POST /api/company/categories` → create company category (auto unique slug).
  - `PATCH /api/company/categories/:id` → update name, slug, visibility, and KA/EN/RU translations (auto slug buttons).
  - `DELETE /api/company/categories/:id` → removes category (detaches post associations first).
- **Editing UX:** inline Edit button opens dialog with default name/slug + per-locale fields; auto slug via wand icon; toggles visibility.
- **Global categories:** displayed read-only; delete/edit disabled.
- **Guardrails:** prevents duplicate slugs; `isPublic=false` keeps category private to company.

- **Requests + Approvals**
  - Manage at `/company/requests`; integrates with `PATCH /api/company/requests/:id` and `DELETE /api/company/requests/:id`.
  - Approval now forces user–company linkage + role promotion; UI shows status badges and mass actions (approve, deny, suspend, reconsider).

## Media
- **Library:** company + specialist images.
- **Upload:** alt-text prompt; foldering (post covers, logos, inline).
- **Actions:** replace, deduplicate, delete (with usage checks).

## Analytics
- **Time range selector** with preset ranges.
- **Metrics:** post views by category, CTR from list to post, reading completion rate, top authors.
- **Exports:** CSV.

## Profile
- **Fields:** name, slug, logo, descriptions, contact info, CTAs.
- **Additional:** specialist showcase order, public page preview, publish toggle (disabled if suspended).

## Settings
- **Roles:** manage internal roles (currently just Specialist access).
- **Notifications:** email/webhook preferences for requests, post status changes.
- **RSS:** enable `/companies/[slug]/posts/rss`.

## Suspension Handling
- **Company suspended:** dashboard read-only except appeals; public listings hidden.
- **Specialist suspended by company:** hidden from public lists; posts remain but author chip becomes plain text.

## Key Flows
- **Create post:** input → validate → draft → preview → publish (assign categories, calculate reading time, push to feeds, bust caches).
- **Edit specialist post:** ensure specialist company matches; save as revision.
- **Approve specialist:** review request, link specialist to company, notify, update list.
- **Remove specialist:** confirm; set `companyId = null`; keep historical attribution.

## Permission Matrix (Company Role)
- Posts: create/edit/publish own ✓, edit specialists’ posts ✓, delete own ✓, delete specialist posts ✗ (archive only ✓).
- Specialists: approve/reject ✓, suspend/unsuspend ✓, edit bios ✓, remove ✓.
- Categories: manage company categories ✓, manage global ✗.
- Profile: edit ✓.
- Analytics: view/export ✓.
- Settings: manage notifications & tokens ✓.

## API Surface (examples)
- `GET /api/company/me`
- `GET /api/company/posts?status=&authorType=&category=&q=&cursor=`
- `POST /api/company/posts`
- `PATCH /api/company/posts/:id`
- `POST /api/company/posts/:id/publish`
- `GET /api/company/specialists?status=`
- `POST /api/company/specialists/:id/suspend`
- `GET /api/company/requests?type=join`
- `POST /api/company/requests/:id/approve`
- `GET /api/company/categories`
- `POST /api/company/categories`
- `GET /api/company/media`
- `POST /api/company/media`
- `GET /api/company/analytics?from=&to=`
- `PATCH /api/company/profile`
- `PATCH /api/company/settings`

## Audit & Logging
- Log all publish/unpublish, approvals, suspensions with actor + timestamp + diff.

## Edge Cases
- Company deletion → convert to “unavailable,” disable links, keep posts.
- Slug changes → create redirects.
- Media deletion → block if in use or require replacement.
- Timezone-safe scheduling for future publishes.


