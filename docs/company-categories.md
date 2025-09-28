# Company Categories Management

## Access & Scope
- **Role:** `COMPANY`
- **API Surface:**
  - `GET /api/company/categories?includeGlobal=true`
  - `POST /api/company/categories`
  - `PATCH /api/company/categories/:id`
  - `DELETE /api/company/categories/:id`
- Global categories (type `GLOBAL`) are readable but immutable inside company dashboard.

## UI Overview (`/${locale}/company/categories`)
- Search box + statistics (totals, visibility badges).
- New Category panel: fields for Name, optional slug, visibility toggle; submits to POST.
- Category list:
  - Displays name, slug, post count, created date, badge (`Company` | `Global`), visibility indicator.
  - **Edit** button opens modal with default fields + KA/EN/RU translation inputs and auto-slug buttons (wand icons).
  - **Delete** button (disabled for global categories). Requires confirmation and removes PostCategory links first.
- “Show global categories” toggle adds global items to list; defaults on.

## Data Rules
- Company-created categories stored with `type = 'COMPANY'`, `companyId = session.companyId`.
- Slugs unique across all categories; server auto-appends counter when needed.
- `isPublic = false` hides category from public site; future private filtering for specialists planned.
- Translations stored via `CompanyTranslation` table (KA handled by base fields, EN/RU via upsert on PATCH).
- DELETE cascades: API deletes `PostCategory` rows before removing category record.

## API Behaviour Details
- GET resolves company context by session companyId → DB fallback (user record) → optional `companySlug` query.
- Response payload:
  ```json
  {
    "categories": [
      {
        "id": "...",
        "name": "...",
        "slug": "...",
        "type": "COMPANY",
        "isPublic": true,
        "companyId": "...",
        "postCount": 3,
        "createdAt": "2025-09-25T12:34:00Z",
        "translations": [
          {"locale":"en","name":"...","slug":"..."},
          {"locale":"ru","name":"...","slug":"..."}
        ]
      }
    ]
  }
  ```
- PATCH accepts optional `translations` array; server upserts per locale.
- DELETE returns `{ success: true }` on completion.

## Guardrails & Future Work
- Protect against accidental deletion when posts exist (currently manual warning; soft delete planned).
- Add audit logging for create/update/delete actions.
- Planned bulk assignment UI (assign categories to posts from dashboard).
- Potential specialist-specific subcategories (requires extended schema).
