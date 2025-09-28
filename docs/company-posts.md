# Company Posts Management

## Scope & Access
- **Role:** `COMPANY`
- **Primary Endpoint:** `GET /api/posts?scope=company&locale=<loc>[&companySlug=<slug>]`
- **Other endpoints:** `POST /api/posts`, `PATCH /api/posts/:id`, `DELETE /api/posts/:id` (all with `scope=company`).

## Data Rules
- Posts included when any of the following are true:
  1. `post.companyId = companyId`.
  2. `post.author.companyId = companyId`.
  3. `post.authorId` matches any `User` whose `companyId = companyId` (covers specialists/employees).
  4. `post.author.email` matches `SpecialistProfile.contactEmail` for specialists linked to the company.
- API resolves companyId from session → user DB fallback → optional `companySlug` query parameter.
- No default status filter; drafts and published posts returned unless client supplies `status=`.

## UI (`/${locale}/company/posts`)
- KPI cards (total, published, drafts).
- Search input filtering by title/excerpt.
- List of posts with title, status badge, excerpt preview, date, author chip, quick actions (view public page, edit, delete).
- Empty state with CTA to create first post.

## Create/Edit Flow
- **New Post:**
  - Route `/${locale}/company/posts/new` renders `CompanyNewPostForm`.
  - Features: KA/EN/RU editor tabs, cover upload, category checklist (company + global categories), slug auto buttons, status toggle.
  - Submit payload:
    ```json
    {
      "title": "...",
      "slug": "...",
      "excerpt": "...",
      "body": "...",
      "status": "DRAFT|PUBLISHED",
      "scope": "company",
      "authorType": "COMPANY",
      "categoryIds": ["..."]
    }
    ```
- **Edit Post:**
  - Route `/${locale}/company/posts/[id]/edit` renders `CompanyEditPostForm`.
  - Loads translations (`PostTranslation`) and category selections (`postCategoryIds`).
  - Allows status updates, cover replacement, localized content editing, category changes.
  - Deletion currently uses `DELETE /api/posts/:id?scope=company` (hard delete).

## Specialist Posts in Dashboard
- Specialists approved for company automatically have `User.companyId` and `SpecialistProfile.companyId` set during approval.
- Posts authored by company specialists appear alongside company-authored posts.
- Company can edit/publish specialist posts but author attribution remains.

## Debug Support
- Non-production responses include `debug` block (resolved company, Prisma `where` clause).
- Server logs debug info when zero posts match, including filters/author ids.

## Future Enhancements
- Archive vs. hard delete.
- Status/category bulk actions.
- Analytics integration (views, engagement metrics per post).
- Draft preview links for specialists.
