#!/bin/bash

# Inspector Microservices Docker Startup Script

set -e  # Exit on error

echo "Starting Inspector Microservices..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Please edit .env with your API keys before continuing."
    echo "Required: CLAUDE_API_KEY or GEMINI_API_KEY for statement-block-service"
    exit 1
fi

# Build and start services
echo "Building Docker images..."
docker compose build

echo "Starting services..."
docker compose up -d

# Show service status
echo ""
echo "Services status:"
docker compose ps

echo ""
echo "✅ Services started successfully!"
echo ""
echo "Available endpoints:"
echo "  - File Server:    http://localhost:9909"
echo "  - Auth Server:    http://localhost:3303" 
echo "  - Statement API:  http://localhost:5000"
echo "  - Linker:         http://localhost:5005"
echo ""
echo "To view logs: docker compose logs -f [service-name]"
echo "To stop:      docker compose down"
echo "To restart:   docker compose restart"
