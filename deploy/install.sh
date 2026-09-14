#!/bin/bash
set -e

# Lotus Asset Management - VPS Installation Script
# Run on Ubuntu 22.04+ as root or with sudo

APP_DIR="/var/www/lotus-asset-management"
APP_PORT=16345
REPO_URL="https://github.com/Refaat1942/Lotus-asset-management.git"

echo "=== Lotus Asset Management - VPS Setup ==="

# Install system dependencies
echo "[1/8] Installing system packages..."
apt-get update -qq
apt-get install -y curl git nginx postgresql postgresql-contrib

# Install Node.js 20
if ! command -v node &> /dev/null; then
  echo "[2/8] Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo "[2/8] Node.js already installed: $(node -v)"
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
  echo "[3/8] Installing PM2..."
  npm install -g pm2
else
  echo "[3/8] PM2 already installed"
fi

# Clone or update app
echo "[4/8] Setting up application..."
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  git pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# Environment file
if [ ! -f .env ]; then
  echo "[5/8] Creating .env file..."
  cp .env.example .env

  DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
  JWT_SECRET=$(openssl rand -base64 48)

  sudo -u postgres psql -c "CREATE USER lotus WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
  sudo -u postgres psql -c "CREATE DATABASE lotus_assets OWNER lotus;" 2>/dev/null || true
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE lotus_assets TO lotus;" 2>/dev/null || true

  sed -i "s|postgresql://postgres:password@localhost:5432/lotus_assets|postgresql://lotus:${DB_PASS}@localhost:5432/lotus_assets|" .env
  sed -i "s|JWT_SECRET=.*|JWT_SECRET=\"${JWT_SECRET}\"|" .env
  sed -i "s|PORT=.*|PORT=${APP_PORT}|" .env
  sed -i "s|NODE_ENV=.*|NODE_ENV=production|" .env

  echo ""
  echo ">>> SAVE THESE CREDENTIALS <<<"
  echo "Database user: lotus"
  echo "Database password: $DB_PASS"
  echo "JWT secret saved in .env"
  echo ""
else
  echo "[5/8] .env already exists, skipping..."
fi

# Install and build
echo "[6/8] Installing dependencies and building..."
npm ci
npx prisma generate
npx prisma db push
npm run db:seed
npm run build

# Create directories
mkdir -p logs backups public/uploads

# PM2
echo "[7/8] Starting with PM2..."
pm2 delete lotus-asset-management 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup

# Firewall
if command -v ufw &> /dev/null; then
  ufw allow ${APP_PORT}/tcp 2>/dev/null || true
  ufw allow OpenSSH 2>/dev/null || true
fi

echo "[8/8] Done!"
echo ""
echo "============================================"
echo "  Lotus Asset Management is running!"
echo "  URL: http://YOUR_VPS_IP:${APP_PORT}"
echo "  Login: admin / admin123"
echo "============================================"
echo ""
echo "Useful commands:"
echo "  pm2 status"
echo "  pm2 logs lotus-asset-management"
echo "  pm2 restart lotus-asset-management"
