#!/bin/bash

# Deployment script for Easypaisa Wallet Linking Service
# This script deploys the service to the VPS

set -e

echo "=== Easypaisa Wallet Linking Service Deployment ==="
echo ""

# Change to deployment directory
cd /opt/easypaisa-wallet

# Create network if it doesn't exist
if ! docker network ls | grep -q easypaisa-network; then
    echo "Creating Docker network: easypaisa-network"
    docker network create easypaisa-network
fi

# Stop existing containers if running
echo "Stopping existing containers..."
docker compose -f docker-compose.production.yml down || true

# Build and start services
echo "Building Docker images..."
docker compose -f docker-compose.production.yml build --no-cache

echo "Starting services..."
docker compose -f docker-compose.production.yml up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "Running database migrations..."
docker compose -f docker-compose.production.yml exec -T app npm run migration:run

echo ""
echo "=== Deployment Complete ==="
echo "Service is now running at: https://easypaisa.mycodigital.io"
echo ""
echo "Check status with: docker compose -f docker-compose.production.yml ps"
echo "View logs with: docker compose -f docker-compose.production.yml logs -f"
echo ""
