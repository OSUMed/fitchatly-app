#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Docker Entrypoint: Starting..."
echo "Attempting database migrations..."

# Run Prisma migrations using the DATABASE_URL from the environment
# set -e will cause the script to exit if this fails
npx prisma migrate deploy

echo "Database migrations finished."

echo "Attempting database seeding..."
node /app/prisma/seed.js
echo "Database seeding finished."

# Now, execute the main command (passed from Dockerfile CMD/ENTRYPOINT)
echo "Starting the application (executing CMD: $@)..."
exec "$@" 