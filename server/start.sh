#!/bin/sh
set -e

# Wait for database to be reachable
echo "Waiting for database..."
MAX_RETRIES=30
RETRY=0
until node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.\$connect().then(()=>{p.\$disconnect();process.exit(0)}).catch(()=>process.exit(1))" 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ $RETRY -ge $MAX_RETRIES ]; then
    echo "Database not reachable after $MAX_RETRIES attempts, proceeding anyway..."
    break
  fi
  echo "  Attempt $RETRY/$MAX_RETRIES — database not ready, waiting 2s..."
  sleep 2
done
echo "Database is reachable."

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
