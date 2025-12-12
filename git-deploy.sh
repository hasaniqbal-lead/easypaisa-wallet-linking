#!/bin/bash
set -e

echo "🚀 Starting Git-based deployment..."

# Navigate to app directory
cd /opt/easypaisa-wallet

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Install dependencies (if package.json changed)
echo "📦 Installing dependencies..."
npm install --production

# Build the application
echo "🔨 Building application..."
npm run build

# Restart Docker container
echo "🔄 Restarting application..."
docker restart easypaisa-app

echo "✅ Deployment complete!"

# Wait for container to start
sleep 5

# Check health
echo "🏥 Checking application health..."
docker exec easypaisa-app wget -O- http://localhost:3000/health 2>&1 || true

echo "📊 Container status:"
docker ps | grep easypaisa-app || docker ps -a | grep easypaisa-app
