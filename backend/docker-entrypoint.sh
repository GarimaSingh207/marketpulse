#!/bin/sh
set -e

echo "[docker-entrypoint] Running database migrations..."
npx prisma db push --skip-generate

echo "[docker-entrypoint] Seeding admin user..."
npx tsx seed-admin.ts || true

echo "[docker-entrypoint] Starting backend server..."
exec node dist/index.js
