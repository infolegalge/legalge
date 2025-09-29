#!/usr/bin/env bash
set -euo pipefail

export DATABASE_URL="file:./prisma/dev.db"
export NEXT_DISABLE_ESLINT=${NEXT_DISABLE_ESLINT:-1}

echo "Installing dependencies with npm ci"
npm ci

echo "Running Prisma migrate deploy"
npx prisma migrate deploy --schema prisma/schema.prisma

echo "Generating Prisma client"
npx prisma generate

echo "Running Next.js production build"
npm run build

if [ "${PRUNE_PRODUCTION:-1}" = "1" ]; then
  echo "Pruning dev dependencies"
  npm prune --production
fi


