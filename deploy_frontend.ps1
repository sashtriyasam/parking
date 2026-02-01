# Simple Deployment Script
echo "Starting build process..."

# Navigate to Frontend
cd frontend

# Clean
echo "Cleaning..."
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
if (Test-Path dist) { Remove-Item -Recurse -Force dist }

# Install
echo "Installing dependencies..."
npm install

# Build
echo "Building..."
npm run build

echo "Build process complete."
