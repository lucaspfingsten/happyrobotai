#!/bin/sh
set -e

# Run database migrations
node node_modules/prisma/build/index.js db push --skip-generate

# Seed database
node node_modules/tsx/dist/cli.mjs prisma/seed.ts

# Start the server — exec replaces the shell so node becomes PID 1
# and receives SIGTERM directly from the container runtime
exec node server.js
