#!/bin/bash

echo "Stopping and removing existing containers..."
docker-compose -f docker-compose.simple.yml down

echo "Removing old images..."
docker rmi codnite-backend codnite-frontend 2>/dev/null || true

echo "Building and starting containers..."
docker-compose -f docker-compose.simple.yml up --build -d

echo "Waiting for services to start..."
sleep 10

echo "Checking container status..."
docker-compose -f docker-compose.simple.yml ps

echo "Checking backend logs..."
docker logs codnite_backend --tail 20

echo "Done! Your application should be running on http://localhost"