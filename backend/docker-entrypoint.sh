#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
# Wait for PostgreSQL to accept connections (don't specify database - just check server)
until pg_isready -h postgres -U fgcmatch_user -d postgres > /dev/null 2>&1; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

# Give PostgreSQL a moment to fully initialize
sleep 2

echo "PostgreSQL is up - running migrations..."
alembic upgrade head || echo "Migration may have failed or already applied"

echo "Seeding initial roles..."
python scripts/seed_roles.py || echo "Roles may already exist, continuing..."

echo "Starting application..."
exec "$@"
