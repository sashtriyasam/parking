$ErrorActionPreference = 'Stop'
Write-Output "Starting build process..."

# Navigate to Frontend
if (Test-Path frontend) { Set-Location frontend }

# Clean
Write-Output "Cleaning..."
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
if (Test-Path dist) { Remove-Item -Recurse -Force dist }

# Install
Write-Output "Installing dependencies..."
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install failed with exit code $LASTEXITCODE" }

# Build
Write-Output "Building..."
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build failed with exit code $LASTEXITCODE" }

Write-Output "Build process complete."
