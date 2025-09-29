#!/bin/bash

# Start Prisma Studio with proper environment variables
export DATABASE_URL="file:./prisma/dev.db"
export NODE_ENV="development"

echo "🚀 Starting Prisma Studio..."
echo "📊 Database: $DATABASE_URL"
echo "🌐 URL: http://localhost:5556"
echo ""

npx prisma studio --port 5556
