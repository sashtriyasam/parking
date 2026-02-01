<#
.SYNOPSIS
    Automated Deployment & Build Script for Parking App Frontend
.DESCRIPTION
    This script attempts to clean the node_modules directory, install dependencies, and build the frontend.
    It includes logic to try and stop existing node processes to release file locks.
#>

Write-Host "🚀 Starting Automated Deployment Script..." -ForegroundColor Cyan

# 1. Attempt to stop existing Node.js processes (User Notification)
Write-Host "⚠️  NOTE: If you have running terminals with 'npm run dev', please close them manually for best results." -ForegroundColor Yellow
Write-Host "   Attempting to kill node processes (this might close other node apps)..." -ForegroundColor Gray
try {
    Stop-Process -Name "node" -ErrorAction SilentlyContinue
    Write-Host "✅ Stopped node processes." -ForegroundColor Green
}
catch {
    Write-Host "ℹ️  No compatible node processes found or access denied." -ForegroundColor Gray
}

# 2. Navigate to Frontend
$FrontendPath = "d:\AAAAAA MINI PROJECT\PARKING THING\frontend"
if (-not (Test-Path $FrontendPath)) {
    Write-Error "❌ Frontend directory not found at $FrontendPath"
    exit 1
}
Set-Location $FrontendPath
Write-Host "📂 Navigated to: $FrontendPath" -ForegroundColor White

# 3. Clean Install
Write-Host "🧹 Cleaning existing dependencies..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
}

# 4. Install Dependencies
Write-Host "📦 Installing dependencies (this may take a minute)..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ npm install failed."
    exit $LASTEXITCODE
}
Write-Host "✅ Dependencies installed." -ForegroundColor Green

# 5. Build
Write-Host "🔨 Building for production..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Build failed. Please check the logs."
    exit $LASTEXITCODE
}

Write-Host "🎉 Build Successful!" -ForegroundColor Green
Write-Host "   Output directory: $FrontendPath\dist" -ForegroundColor White
Write-Host "   Ready for deployment." -ForegroundColor White
