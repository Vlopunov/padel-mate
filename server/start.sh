#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy || {
  echo "Migration deploy failed. Attempting baseline..."
  # Find the first migration directory
  FIRST_MIGRATION=$(ls -1 prisma/migrations/ | head -n1)
  if [ -n "$FIRST_MIGRATION" ] && [ "$FIRST_MIGRATION" != "migration_lock.toml" ]; then
    npx prisma migrate resolve --applied "$FIRST_MIGRATION"
    npx prisma migrate deploy
  else
    echo "No migrations found to baseline"
    exit 1
  fi
}

echo "Starting server..."
node index.js
