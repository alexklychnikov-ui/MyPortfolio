#!/bin/bash
set -e

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo ".env not found in Backend/. Copy .env.example and fill secrets."
  exit 1
fi

docker compose -f docker-compose.yml pull || true
docker compose -f docker-compose.yml up -d --build
docker compose -f docker-compose.yml ps
