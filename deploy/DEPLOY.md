# VPS Deployment Guide

Deploy Lotus Asset Management on a Linux VPS on **port 16345**.

## Quick Install (Ubuntu 22.04+)

SSH into your VPS and run:

```bash
curl -fsSL https://raw.githubusercontent.com/Refaat1942/Lotus-asset-management/main/deploy/install.sh | sudo bash
```

Or manually:

```bash
git clone https://github.com/Refaat1942/Lotus-asset-management.git /var/www/lotus-asset-management
cd /var/www/lotus-asset-management
chmod +x deploy/install.sh
sudo ./deploy/install.sh
```

## Manual Deployment

### 1. Server Requirements

- Ubuntu 22.04+ or Debian 12+
- 2 GB RAM minimum
- Node.js 18+
- PostgreSQL 14+
- PM2 (process manager)

### 2. Install Dependencies

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib

# PM2
sudo npm install -g pm2
```

### 3. PostgreSQL Setup

```bash
sudo -u postgres psql
```

```sql
CREATE USER lotus WITH PASSWORD 'your_secure_password';
CREATE DATABASE lotus_assets OWNER lotus;
GRANT ALL PRIVILEGES ON DATABASE lotus_assets TO lotus;
\q
```

### 4. Application Setup

```bash
git clone https://github.com/Refaat1942/Lotus-asset-management.git /var/www/lotus-asset-management
cd /var/www/lotus-asset-management

cp .env.example .env
nano .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://lotus:your_secure_password@localhost:5432/lotus_assets?schema=public"
JWT_SECRET="generate-a-long-random-secret-here"
PORT=16345
NODE_ENV=production
BACKUP_DIR="./backups"
BACKUP_CRON="0 2 * * *"
UPLOAD_DIR="./public/uploads"
```

### 5. Build and Start

```bash
npm ci
npx prisma generate
npx prisma db push
npm run db:seed
npm run build

mkdir -p logs backups public/uploads

pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Open Firewall Port

```bash
sudo ufw allow 16345/tcp
sudo ufw allow OpenSSH
sudo ufw enable
```

### 7. Access

Open in browser: `http://YOUR_VPS_IP:16345`

Default login: `admin` / `admin123`

## Updates

```bash
cd /var/www/lotus-asset-management
./deploy/update.sh
```

## PM2 Commands

```bash
pm2 status                          # Check status
pm2 logs lotus-asset-management     # View logs
pm2 restart lotus-asset-management  # Restart app
pm2 stop lotus-asset-management       # Stop app
```

## Optional: Nginx Reverse Proxy

To serve on port 80 with a domain name:

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/lotus-asset-management
sudo nano /etc/nginx/sites-available/lotus-asset-management  # Set your domain
sudo ln -s /etc/nginx/sites-available/lotus-asset-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL with Certbot (optional)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot connect | Check `sudo ufw status`, ensure port 16345 is open |
| Database error | Verify `DATABASE_URL` in `.env`, check PostgreSQL is running |
| App crashes | Run `pm2 logs lotus-asset-management` for errors |
| Build fails | Ensure Node.js 18+ with `node -v` |
