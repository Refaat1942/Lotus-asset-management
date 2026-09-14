# Lotus Asset Management - Windows Database Setup
# Usage: .\scripts\setup-windows.ps1
# Or:    .\scripts\setup-windows.ps1 -PostgresPassword "your_password"

param(
    [string]$PostgresPassword
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

Set-Location $ProjectRoot

if (-not $PostgresPassword) {
    Write-Host ""
    Write-Host "=== Lotus Asset Management - Database Setup ===" -ForegroundColor Cyan
    Write-Host "Enter your PostgreSQL 'postgres' user password"
    Write-Host "(the password you set when installing PostgreSQL 18)"
    Write-Host ""
    $securePass = Read-Host "PostgreSQL password" -AsSecureString
    $PostgresPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
    )
}

if (-not $PostgresPassword) {
    Write-Host "Error: Password is required" -ForegroundColor Red
    exit 1
}

$env:PGPASSWORD = $PostgresPassword

Write-Host "[1/5] Testing PostgreSQL connection..." -ForegroundColor Yellow
& $Psql -U postgres -h localhost -d postgres -c "SELECT 1" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to connect. Check your PostgreSQL password and that the service is running." -ForegroundColor Red
    Write-Host "Service check: Get-Service postgresql*" -ForegroundColor Gray
    exit 1
}
Write-Host "  Connected OK" -ForegroundColor Green

Write-Host "[2/5] Creating database..." -ForegroundColor Yellow
& $Psql -U postgres -h localhost -d postgres -c "CREATE DATABASE lotus_assets;" 2>&1 | Out-Null
# Ignore error if database already exists

Write-Host "[3/5] Updating .env file..." -ForegroundColor Yellow
$escapedPass = $PostgresPassword -replace ':', '%3A' -replace '@', '%40'
$envContent = @"
DATABASE_URL="postgresql://postgres:${escapedPass}@localhost:5432/lotus_assets?schema=public"
JWT_SECRET="lotus-asset-management-production-secret-change-me"
PORT=16345
NODE_ENV=development
BACKUP_DIR="./backups"
BACKUP_CRON="0 2 * * *"
UPLOAD_DIR="./public/uploads"
"@
Set-Content -Path ".env" -Value $envContent -Encoding UTF8
Write-Host "  .env updated" -ForegroundColor Green

Write-Host "[4/5] Running database migrations..." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "[5/5] Seeding admin user..." -ForegroundColor Yellow
npm run db:seed
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "  Start app:  npm run dev" -ForegroundColor White
Write-Host "  URL:        http://localhost:16345" -ForegroundColor White
Write-Host "  Login:      admin / admin123" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
