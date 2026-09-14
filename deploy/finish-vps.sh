#!/bin/bash
# Finish VPS setup on PORT 16345
# Run after database is created: sudo ./deploy/finish-vps.sh

set -e

APP_PORT=16345
APP_DIR="/var/www/lotus-asset-management"

cd "$APP_DIR"

echo "=== Finishing Lotus setup on port ${APP_PORT} ==="

# Ensure .env exists with correct port
if [ ! -f .env ]; then
  echo "ERROR: .env not found. Create it first:"
  echo "  cp .env.example .env"
  echo "  nano .env"
  exit 1
fi

# Force PORT=16345 in .env
grep -q "^PORT=" .env && sed -i "s/^PORT=.*/PORT=${APP_PORT}/" .env || echo "PORT=${APP_PORT}" >> .env
grep -q "^NODE_ENV=" .env && sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' .env || echo "NODE_ENV=production" >> .env
grep -q "^COOKIE_SECURE=" .env && sed -i 's/^COOKIE_SECURE=.*/COOKIE_SECURE=false/' .env || echo "COOKIE_SECURE=false" >> .env

echo "[1/6] Installing dependencies..."
npm ci

echo "[2/6] Database setup..."
npx prisma generate
npx prisma db push
npm run db:seed
npm run qr:backfill

echo "[3/6] Building application..."
npm run build

echo "[4/6] Creating directories..."
mkdir -p logs backups public/uploads

echo "[5/6] Starting PM2 on port ${APP_PORT}..."
npm install -g pm2 2>/dev/null || true
pm2 delete lotus-asset-management 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo "[6/6] Opening firewall port ${APP_PORT}..."
if command -v ufw &> /dev/null; then
  ufw allow ${APP_PORT}/tcp 2>/dev/null || true
  ufw allow OpenSSH 2>/dev/null || true
fi

# Verify port is listening
sleep 2
if ss -tlnp | grep -q ":${APP_PORT}"; then
  echo ""
  echo "============================================"
  echo "  SUCCESS - App running on port ${APP_PORT}"
  echo "  URL: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_VPS_IP'):${APP_PORT}"
  echo "  Login: admin / admin123"
  echo "============================================"
else
  echo ""
  echo "WARNING: Port ${APP_PORT} may not be listening yet."
  echo "Check: pm2 logs lotus-asset-management"
fi
