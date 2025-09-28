# legal-ge
legal-ge website

## Environment

Create a `.env` with:

```
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=replace-with-strong-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SUPER_ADMIN_EMAIL=admin@example.com

# Dev DB (SQLite)
DATABASE_URL=file:./prisma/dev.db

# Public
NEXT_PUBLIC_SITE_URL=http://localhost:3002
NEXT_PUBLIC_WP_BASE_URL=https://infolegalge-fcztd.wpcomstaging.com
```

For production, use Postgres:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
```

## Scripts

- `npm run dev` (port 3001)
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`
- `npm run prisma:generate`, `npm run prisma:push`, `npm run prisma:migrate:deploy`

## Deployment DB plan

- Keep SQLite for local/dev.
- Provision Postgres in prod (Supabase/Neon/RDS).
- Set `DATABASE_URL` via env.
- Use `prisma migrate deploy` on deploy.
