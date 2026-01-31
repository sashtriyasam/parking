# Quick Setup Script for Windows
# Run this after starting PostgreSQL

Write-Host "ParkEase - Quick Setup Script" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is running
Write-Host "Checking PostgreSQL status..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if ($null -eq $pgService) {
    Write-Host "PostgreSQL service not found!" -ForegroundColor Red
    Write-Host "Please install PostgreSQL or start it manually" -ForegroundColor Yellow
    exit 1
}

if ($pgService.Status -ne "Running") {
    Write-Host "PostgreSQL is not running. Attempting to start..." -ForegroundColor Yellow
    try {
        Start-Service $pgService.Name -ErrorAction Stop
        Write-Host "Started PostgreSQL service successfully." -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to start PostgreSQL service. Please run as Administrator." -ForegroundColor Red
        exit 1
    }
    Start-Sleep -Seconds 5
}

Write-Host "PostgreSQL is running" -ForegroundColor Green

# Navigate to backend directory
if (Test-Path "backend") {
    Set-Location -Path "backend"
}

# Push Prisma schema
Write-Host ""
Write-Host "Pushing database schema..." -ForegroundColor Yellow
npx prisma db push --accept-data-loss

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to push schema. Checking if database exists..." -ForegroundColor Red
    # Prisma usually creates the DB if it doesn't exist, but P1001 means it can't even connect to the server.
    exit 1
}

Write-Host "Schema pushed successfully" -ForegroundColor Green

# Seed database
Write-Host ""
Write-Host "Seeding database with test data..." -ForegroundColor Yellow
node prisma/seed.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to seed database" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Test Credentials:" -ForegroundColor Cyan
Write-Host "  Provider: provider@test.com / provider123" -ForegroundColor White
Write-Host "  Customer: customer@test.com / customer123" -ForegroundColor White
Write-Host ""
Write-Host "Starting backend server..." -ForegroundColor Yellow
Write-Host ""

# Start the backend server
npm run dev
