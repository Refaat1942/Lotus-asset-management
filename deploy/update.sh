#!/bin/bash
set -e

APP_DIR="/var/www/lotus-asset-management"

echo "=== Updating Lotus Asset Management ==="

cd "$APP_DIR"
git pull origin main
npm ci
npx prisma generate
npx prisma db push
npm run build
pm2 restart lotus-asset-management

echo "Update complete! Running on port 16345"
