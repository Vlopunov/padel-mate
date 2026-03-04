#!/bin/sh
set -e

# Try to deploy migrations normally (works for fresh DB or already baselined)
if npx prisma migrate deploy; then
  echo "Migrations applied successfully"
else
  # Existing DB without _prisma_migrations table: baseline the init migration
  echo "Migration deploy failed. Baselining init migration..."
  npx prisma migrate resolve --applied 20250304000000_init
  npx prisma migrate deploy
fi

node index.js
