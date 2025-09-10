# Docker Setup for Inspector Microservices

This Docker setup replaces the manual process in `setup.md` by containerizing all microservices.

## Prerequisites

### Install Docker (if not already installed)

```bash
# For Linux users:
./install-docker.sh

# After installation, either:
# 1. Log out and back in, OR
# 2. Run: newgrp docker
```

For other operating systems, visit: https://docs.docker.com/get-docker/

## Quick Start

1. **Setup environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. **Start all services:**
   ```bash
   ./start.sh
   ```

3. **Stop all services:**
   ```bash
   ./stop.sh
   ```

## Services

The Docker Compose setup includes:

- **statement-block-service** (port 5000) - AI text processing
- **file-server** (port 9909) - Serves frontend files
- **auth-server** (port 3000) - Firebase authentication
- **linker** (port 3001) - Syncs game data to local files

## Configuration

Edit `.env` file to configure:
- `CLAUDE_API_KEY` - For Claude AI integration
- `GEMINI_API_KEY` - For Gemini AI integration  
- `MODEL_PROVIDER` - Choose between 'claude' or 'gemini'
- `FLASK_ENV` / `NODE_ENV` - Set to 'production' for production

## Commands

```bash
# View logs for all services
docker compose logs -f

# View logs for specific service
docker compose logs -f statement-block-service

# Restart a specific service
docker compose restart auth-server

# Rebuild after code changes
docker compose build
docker compose up -d

# Remove all containers and networks
docker compose down
```

## Ngrok Support

To enable ngrok tunneling, uncomment the ngrok service in `docker-compose.yml` and set `NGROK_AUTHTOKEN` in `.env`.

## Troubleshooting

- If ports are already in use, stop any manually running services first
- Check logs with `docker compose logs [service-name]`
- Ensure Firebase service account JSON exists at `auth-server/firebase-service.json`
- If you get permission errors, make sure you're in the docker group: `newgrp docker`
