# Lotus Asset Management System

Professional web-based Asset Management System with Arabic/English support, PostgreSQL database, and comprehensive asset lifecycle tracking.

## Features

- **Asset Management**: Full asset tracking with departments, branches, assignments, transfers, and history
- **Bilingual UI**: Arabic (RTL) and English (LTR) with language switching
- **Excel Import/Export**: Import from Lotus-Items.xlsx with column mapping, export reports to Excel
- **Authorization Matrix**: Role-based permissions with configurable access control
- **Reports**: Date-range filtered reports for assets, assignments, transfers, history, and depreciation
- **Daily Backup**: Automated PostgreSQL backup scheduler
- **Company Logo**: Configurable logo upload

## Requirements

- Node.js 18+
- PostgreSQL 14+
- pg_dump (for backups)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your PostgreSQL connection:
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/lotus_assets?schema=public"
   JWT_SECRET="your-secret-key"
   PORT=16345
   ```

3. **Create database and run migrations**:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. **Place Excel file** (optional):
   Copy `Lotus-Items.xlsx` to the project root for initial data import.

5. **Start the application**:
   ```bash
   npm run dev
   ```

   Access at: http://localhost:16345

## VPS Deployment

Deploy on a Linux VPS on **port 16345**:

```bash
git clone https://github.com/Refaat1942/Lotus-asset-management.git /var/www/lotus-asset-management
cd /var/www/lotus-asset-management
chmod +x deploy/install.sh
sudo ./deploy/install.sh
```

See [deploy/DEPLOY.md](deploy/DEPLOY.md) for full deployment guide.

Quick update after changes:
```bash
./deploy/update.sh
```

## Default Login

- **Username**: `admin`
- **Password**: `admin123`

## Port

The application runs on **port 16345** by default.

## Excel Import

1. Navigate to Excel Import
2. Upload `Lotus-Items.xlsx` or compatible file
3. Review auto-detected column mappings
4. Adjust mappings if needed
5. Start import

Inspect Excel structure:
```bash
npm run inspect-excel
```

## Backup

- **Automatic**: Daily at 2:00 AM (configurable via `BACKUP_CRON`)
- **Manual**: Settings page or `npm run backup`
- **Location**: `./backups/` directory

## Tech Stack

- Next.js 14 (App Router)
- PostgreSQL + Prisma ORM
- Tailwind CSS
- JWT Authentication
- xlsx for Excel processing
