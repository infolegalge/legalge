#!/usr/bin/env bash
set -euo pipefail

export DATABASE_URL="file:./prisma/dev.db"
export NEXT_DISABLE_ESLINT=${NEXT_DISABLE_ESLINT:-1}

echo "Running npm ci --omit=dev"
npm ci --omit=dev

echo "Running Prisma migrate deploy"
npx prisma migrate deploy --schema prisma/schema.prisma

echo "Generating Prisma client"
npx prisma generate

echo "Running Next.js production build"
npm run build


