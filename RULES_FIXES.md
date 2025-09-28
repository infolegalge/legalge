# RULES_FIXES.md — Strict Rules for TypeScript/Lint Repairs

## Objective

Fix TypeScript errors and ESLint warnings without deleting or neutering any functions, components, props, or API routes. Preserve behavior and public interfaces. Improve types and performance safely.

## Scope

Codebase: Next.js 15 App Router + Turbopack, TypeScript, Prisma.

Files include /src/app/**, /src/components/**, /src/lib/**, /src/scripts/**.

## Non-Negotiable Constraints

- Do NOT delete any function, component, prop, exported symbol, or API handler.
- Do NOT stub logic or return early to silence errors.
- Do NOT change runtime behavior or UI output, except for sanctioned performance fixes.
- Do NOT remove required types or narrow them incorrectly.
- Preserve file/module structure and named exports.

## Allowed Changes

- Add or refine TypeScript types and generics.
- Convert any to precise types.
- Add safe runtime guards and null checks.
- Serialize server objects for client props.
- Replace <img> with next/image where feasible, keeping the same src, alt, width/height or fill.
- Remove unused imports/variables only; if needed by future code, prefix with _ to satisfy lint.
- Add useCallback, useMemo, or dependency corrections for hooks.
- Add non-breaking utility types and small helper functions.

## Disallowed Changes

- No removal of business logic.
- No API signature changes visible outside the file.
- No renaming of exported components/functions.
- No converting client components to server or vice versa unless required by Next.js typing and behavior remains identical.


