# Super Admin Rules & Capabilities

## Access
- **Role:** `SUPER_ADMIN`
- **Scope:** Entire platform—companies, specialists, posts, categories, media, analytics, settings, billing, audit.

## Responsibilities Summary
- Govern global content and user management.
- Override and support company/specialist/subscriber needs.
- Maintain system health, compliance, and analytics.

## Navigation & Modules
- Overview (global KPIs)
- Companies
- Specialists
- Posts (global)
- Categories (global)
- Requests/Moderation
- Media Library
- Analytics (platform-wide)
- Settings & Configuration
- Audit Logs

## Overview
- KPIs: total companies, active vs suspended, total posts, views, conversion funnels.
- Activity feed: recent moderation actions, company signups, escalations.
- Alerts: suspension queues, pending compliance, failed integrations.
- Quick actions: create company, invite admin, review flagged content.

## Companies Module
- List all companies (status, plan, metrics).
- Actions: create, edit, suspend, reinstate, soft-delete.
- Drill-down/impersonate company dashboard; override guardrails when necessary.

## Specialists Module
- Global list with filters (company, status, role, request type).
- Actions: approve, suspend/unsuspend, reassign companies, reset credentials.

## Posts Module
- Global feed: filters by status, locale, author type, company, category, date.
- Actions: feature, unpublish, delete, restore revisions, moderate flagged posts.
- Manage translations (view/edit; ensure locale slugs fallbacks).

## Categories Module
- Manage global taxonomy (create/edit/delete, translation support).
- View/override company categories; force reassignment when needed.

## Requests & Moderation
- Queues: specialist joins, company onboarding, appeals, content flags.
- Workflow: assign reviewer, add notes, approve/reject/request info.
- Mandatory audit log entries on every decision.

## Media Library
- Global media inventory with tagging, dedupe, usage tracking.
- Actions: replace, delete, reassign ownership, moderate flagged media.

## Analytics
- Platform dashboard: traffic, engagement, top companies/specialists, post performance.
- Reporting: CSV export, scheduled email summaries, investigation drill-downs.

## Settings & Configuration
- Manage locales, feature toggles, billing plans.
- Notifications for system alerts, SLA breaches.
- API credential management (platform-level).
- Suspension policies and automation rules.

## Audit & Logging
- Record every action (actor, timestamp, diff, target entity).
- Access raw audit log for compliance; investigate suspicious activity (IP/events).

## Permissions Summary
- Full CRUD over all entities.
- Impersonate company or specialist dashboards.
- Override guardrails (auto audit entry).
- Manage billing/subscription lifecycle.

## Integrations
- Webhooks management, retry mechanisms.
- External services (logging, analytics, payments) configuration.


