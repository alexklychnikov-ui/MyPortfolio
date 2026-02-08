#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# Check required variables
if [ -z "$DOMAIN" ] || [ -z "$LETSENCRYPT_EMAIL" ]; then
    echo -e "${RED}❌ DOMAIN and LETSENCRYPT_EMAIL must be set in .env${NC}"
    exit 1
fi

echo -e "${YELLOW}🔧 Setting up SSL certificate for $DOMAIN${NC}"

# Create necessary directories
mkdir -p certs certbot-webroot

# Get initial certificate
echo -e "${YELLOW}📜 Obtaining SSL certificate...${NC}"
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --email $LETSENCRYPT_EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Replace DOMAIN_PLACEHOLDER in nginx config
echo -e "${YELLOW}🔄 Updating nginx configuration...${NC}"
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" Frontend/nginx/nginx.conf

# Restart nginx
echo -e "${YELLOW}🔄 Restarting nginx...${NC}"
docker compose restart nginx

echo -e "${GREEN}✅ SSL certificate installed successfully!${NC}"
echo -e "${GREEN}🌐 Your site is now available at https://$DOMAIN${NC}"
