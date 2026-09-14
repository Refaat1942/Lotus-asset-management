# Database setup script for Lotus Asset Management
# Usage: .\scripts\setup-db.ps1 -Password "your_postgres_password"

param(
    [Parameter(Mandatory=$true)]
    [string]$Password
)

$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$env:PGPASSWORD = $Password

Write-Host "Creating database lotus_assets..."
& $psql -U postgres -h localhost -c "CREATE DATABASE lotus_assets;" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Database may already exist, continuing..."
}

$envContent = @"
DATABASE_URL="postgresql://postgres:$Password@localhost:5432/lotus_assets?schema=public"
JWT_SECRET="lotus-asset-management-production-secret-change-me"
PORT=16435
NODE_ENV=development
BACKUP_DIR="./backups"
BACKUP_CRON="0 2 * * *"
UPLOAD_DIR="./public/uploads"
"@

Set-Content -Path ".env" -Value $envContent
Write-Host ".env file updated"

Write-Host "Running Prisma migrations..."
npx prisma db push

Write-Host "Seeding database..."
npm run db:seed

Write-Host "Setup complete! Run 'npm run dev' to start the application on port 16435"
