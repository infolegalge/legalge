# Platform Roles & Privileges

## Roles Overview
- **Super Admin** – full platform control; can override any tenant, run platform-wide analytics, migrate data, manage global taxonomies.
- **Company** – manages own organisation (posts, specialists, categories, requests, analytics, profile, settings).
- **Specialist** – manages personal profile and posts; when attached to a company follows company guardrails.
- **Subscriber** – basic reader account; can request upgrade to company or specialist.

## Privilege Matrix
| Module / Capability                      | Super Admin | Company | Specialist              | Subscriber |
|------------------------------------------|-------------|---------|-------------------------|------------|
| News Posts (CRUD)                        | ✓ all       | ✓ own + specialists | ✓ own posts           | read only |
| Global categories                        | ✓ manage    | read     | read                    | read       |
| Company categories                       | ✓ override  | ✓ full   | read                    | ✗          |
| Specialists (approve/suspend/edit)       | ✓           | ✓ own org| self management only   | ✗          |
| Company requests (join/upgrade)          | ✓           | ✓ own org| view status / submit   | submit     |
| Analytics                                | ✓ platform  | ✓ org    | limited (coming)       | ✗          |
| Company profile/settings                 | ✓ override  | ✓ own    | read                    | ✗          |
| Specialist profile                       | ✓ override  | suggest edits | ✓ own profile       | ✗          |
| Media library                            | ✓ global    | ✓ org    | ✓ personal              | ✗          |
| Suspension actions                       | ✓ any role  | specialists only | appeal guidance | ✗          |
| API/Webhooks                             | ✓ configure | limited  | ✗                       | ✗          |
| Role upgrades                            | ✓ approve   | request specialists | request company upgrade | request specialist |
| Authentication (SSO, session overrides)  | manage      | own users| own session            | own session |

## Role Relationships
- **Company ↔ Specialist**
  - Company can approve specialist requests; approval sets `User.companyId` and `SpecialistProfile.companyId`.
  - Company can edit specialist profiles (excluding email) and deactivate specialists.
  - Specialist posts appear in company dashboard via API filters.
- **Super Admin ↔ Company/Specialist**
  - Super Admin can impersonate, resolve issues, migrate data, and override categories/posts.
  - Audit logs capture Super Admin overrides for traceability.
- **Subscriber → Specialist/Company**
  - Subscriber can submit upgrade requests (`/request` flows).
  - Requests reviewed by Company (when targeted) or Super Admin.

## Additional Notes
- Role-based API scopes (`scope=company|specialist|superadmin`) enforce server-side authorization.
- Session payload includes `role`, `companyId`, `companySlug`, `lawyerSlug` to allow resolution of tenant context.
- Suspensions restrict CRUD actions while preserving read access for audit.


