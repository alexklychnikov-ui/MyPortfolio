#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Copy .env.example to .env and configure it first."
    exit 1
fi

# Pull latest changes
echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
git fetch origin main
git reset --hard origin/main

# Build and start containers
echo -e "${YELLOW}🔨 Building and starting containers...${NC}"
docker compose pull || true
docker compose up -d --build

# Wait for health check
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 15

# Check status
echo -e "${YELLOW}📊 Container status:${NC}"
docker compose ps

# Cleanup
echo -e "${YELLOW}🧹 Cleaning up old images...${NC}"
docker image prune -af --filter "until=72h"

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
