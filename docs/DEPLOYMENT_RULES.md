# Local Update Checklist

Whenever you touch the project, run these terminal steps before committing:

1. `git status -sb` – see what changed.
2. `npm ci`
3. `npx prisma migrate dev` (records new migrations locally if the schema changed).
4. `git status -- prisma/migrations` – if a new migration folder was created, review it and commit it.
5. `npx prisma generate` (if the schema changed; otherwise optional).
6. `npx tsx scripts/seed-practices-services.ts` (upserts data; safe to rerun).
7. `npm run build`
8. Optionally `npm run start` to verify the UI.
9. Resolve lint/test errors if any appear.
10. `git add <files>`
11. `git commit -m "Describe change"`
12. `git push`

If any step fails, fix it immediately before moving on.

# Handling Schema Changes Safely

1. Modify `prisma/schema.prisma` as needed.
2. Create a migration (local only):
   - `npx prisma migrate dev --name <migration_name>`
3. Inspect the generated SQL in `prisma/migrations/`.
4. Commit both the schema and migration files.
5. Never delete or rewrite migrations that ran on shared environments—add new ones instead.

# Docker Build Check

Before pushing, confirm the Docker build matches production:

1. `docker build -t legalge-builder -f Dockerfile.build .`
2. `docker run --rm -it legalge-builder sh`
3. Inside container:
   - `npx prisma migrate deploy`
   - `npx prisma generate`
   - `npx tsx scripts/seed-practices-services.ts`
   - `npm run build`
   - Optionally `npm run start -- -p 3000`
4. Exit the container when done.

If any command fails, fix the code before committing.

# Droplet Deployment Workflow

After the code is merged to main, deploy to the droplet following these steps:

1. `ssh vakho@178.128.246.203`
2. `cd /home/vakho/apps/legalge`
3. `git fetch origin`
4. `git reset --hard origin/main`
5. `npm ci`
6. `npx prisma migrate deploy`
7. `npx prisma generate`
8. `npx tsx scripts/seed-practices-services.ts`
9. `npm run build`
10. `pm2 restart legalge --update-env`
11. `pm2 logs legalge --lines 200` (check for errors)
12. Hit `https://legal.ge` or `curl -I` to confirm CSS assets load.

**Rule:** Do not skip the seed/build steps. If any command fails, stop and fix the issue before moving to the next environment.

