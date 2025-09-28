# Post Creation Guidelines

> **Applies to all roles** that can author content (Super Admin, Company, Specialist). Use these rules for every new post and editor implementation.

## Editor Requirements
- Use the shared **RichEditor** (tiptap-based) component with:
  - Toolbar (bold, italic, underline, headings, lists, quote, media embeds).
  - HTML toggle for advanced users (optional based on role).
  - Autosave hooks (optional future enhancement).
- Localized tabs (KA base, EN, RU) when translations are supported for the role.
- Slug inputs per locale with “Auto” generation button using `makeSlug`.

## Base Content Fields (KA)
- Title *(required)*
- Slug *(required, auto-generated if blank)*
- Excerpt *(optional, used for previews/SEO)*
- Body *(required rich text)*
- Categories *(multi-select)*
- Cover image *(required for published posts)*
- Status: Draft | Published | Archived
- Optional: scheduled publish datetime (if role supports scheduling).

## Translations (EN, RU)
- Provide Title, Slug, Excerpt, Body per locale.
- If slug left blank, generate from localized title.
- Store translations via `PostTranslation` table.
- Fallback to KA when translation missing.

## Metadata & SEO (roles permitting)
- Meta title (<=60 chars) and meta description (<=155 chars) per locale.
- Canonical URL: `/{locale}/news/{slug}`.
  - Ensure translated slugs resolve via `/api/slugs/news` when switching locales.

## Validation & Guardrails
- Draft requires KA title + body.
- Publish requires cover image, category selection, slug uniqueness, company not suspended.
- Ensure slug uniqueness per locale before saving (`finalSlug` check).
- Prevent content saves if user is suspended or lacks permission.

## Workflow
1. Author opens editor (RichEditor loaded with localization tabs).
2. Fill KA base fields; optionally add translations.
3. Assign categories, set cover image, adjust status.
4. Save Draft (persists but not public).
5. Preview (optional).
6. Publish (sets `status = PUBLISHED`, calculates `readingTime`, invalidates caches).

## API Expectations
- Create: `POST /api/posts` with `scope` (`specialist`, `company`, or `superadmin`).
- Update: `PATCH /api/posts/:id` (same scope rules).
- Payload includes:
  ```json
  {
    "title": "...",
    "slug": "...",
    "excerpt": "...",
    "body": "<p>...</p>",
    "coverImage": "/api/images/...",
    "status": "DRAFT|PUBLISHED|ARCHIVED",
    "locale": "ka",
    "categoryIds": ["..."],
    "translations": [
      {"locale":"en","title":"...","slug":"...","body":"...","excerpt":"..."},
      {"locale":"ru", ... }
    ]
  }
  ```
- Server ensures unique slugs per locale and connects company via relation when needed.

## Post-Save Hooks
- Calculate reading time (`readingTime` field).
- Update analytics counters (views = 0 on create).
- Trigger cache invalidation (`revalidatePath('/[locale]/news')`).
- Write audit log entry (actor, action, post id, diff).

## Media Handling
- Images uploaded through media library endpoints (company or specialist scope).
- Store referenced media IDs for deletion safety.

## Testing Checklist
- Create + Publish from Company, Specialist, Super Admin.
- Locale switch on published article works (translated slug route).
- Draft remains hidden from public listings.
- Categories displayed in lists/cards.
- RichEditor content renders in news detail page (sanitized HTML).


