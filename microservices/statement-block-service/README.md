# Statement Block Processing Microservice

A Flask-based microservice that uses Claude Sonnet 3.5 to process unstructured text into organized statement blocks. This service is general-purpose and can be used across different contexts where text needs to be cleaned, organized, and structured.

## Features

- **Intelligent Text Processing**: Uses Claude AI to break text into coherent statement blocks
- **Grammar Correction**: Automatically fixes grammar while preserving meaning
- **Filler Word Removal**: Cleans up speech artifacts (um, uh, like, etc.)
- **Block Merging**: Intelligently merges new text with existing blocks
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **Error Handling**: Graceful fallback processing if AI service fails
- **Docker Support**: Ready for containerized deployment
- **Health Monitoring**: Built-in health check endpoint

## Quick Start

### Prerequisites

- Python 3.11+
- Redis (optional, for rate limiting)
- Anthropic API key

### Local Setup

1. Clone the repository and navigate to the project directory:
```bash
cd statement-block-service
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Copy `.env.example` to `.env` and add your Anthropic API key:
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

5. Run the application:
```bash
python app.py
```

The service will be available at `http://localhost:5000`

### Docker Setup

1. Build and run with Docker Compose:
```bash
docker-compose up --build
```

This will start both the Flask application and Redis for rate limiting.

## API Documentation

### POST /process-text

Process unstructured text into organized statement blocks.

**Request:**
```json
{
    "text": "string - the new text to process",
    "existing_blocks": ["array", "of", "existing", "statement", "blocks"]
}
```

**Response:**
```json
{
    "blocks": ["array", "of", "processed", "statement", "blocks"],
    "processing_time_ms": 1234
}
```

**Example Request:**
```bash
curl -X POST http://localhost:5000/process-text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "So I was using the app and like the menu is really hard to find you know and also the colors are too bright it hurts my eyes",
    "existing_blocks": []
  }'
```

**Example Response:**
```json
{
    "blocks": [
        "The menu is difficult to find in the app.",
        "The color scheme is too bright and causes eye strain."
    ],
    "processing_time_ms": 1543
}
```

### GET /health

Check the health status of the service.

**Response:**
```json
{
    "status": "healthy",
    "service": "statement-block-service",
    "version": "1.0.0",
    "redis": "connected"
}
```

## Configuration

Configuration is managed through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (required) | - |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `MAX_TEXT_LENGTH` | Maximum input text length | `10000` |
| `MAX_BLOCKS` | Maximum number of blocks | `50` |
| `REQUEST_TIMEOUT` | Request timeout in seconds | `30` |
| `RATE_LIMIT_ENABLED` | Enable rate limiting | `true` |
| `RATE_LIMIT_CALLS` | Number of allowed calls | `100` |
| `RATE_LIMIT_PERIOD` | Period in seconds | `3600` |
| `FLASK_ENV` | Flask environment | `production` |
| `FLASK_DEBUG` | Enable debug mode | `false` |

## Testing

Run the test suite:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=.

# Run specific test file
pytest tests/test_app.py
```

## Deployment

### Production Checklist

1. **Environment Variables**: Ensure all required environment variables are set
2. **HTTPS**: Use a reverse proxy (nginx) with SSL in production
3. **Monitoring**: Set up monitoring for response times and error rates
4. **Logging**: Configure appropriate log levels and aggregation
5. **Rate Limiting**: Ensure Redis is properly configured for rate limiting
6. **Security**: Keep API keys secure and never expose them

### Docker Deployment

```bash
# Build production image
docker build -t statement-block-service:latest .

# Run with environment file
docker run -p 5000:5000 --env-file .env statement-block-service:latest
```

### Using with nginx

Example nginx configuration:

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Enable gzip
        gzip on;
        gzip_types application/json;
    }
}
```

## How It Works

1. **Text Reception**: The service receives unstructured text and optional existing blocks
2. **AI Processing**: Claude Sonnet 3.5 processes the text to:
   - Identify distinct thoughts/statements
   - Clean up speech artifacts
   - Fix grammar without changing meaning
   - Merge related ideas with existing blocks
3. **Fallback Processing**: If AI fails, a rule-based processor handles the text
4. **Response**: Returns organized blocks limited to 1-3 sentences each

## Performance

- Average response time: < 2 seconds
- 99th percentile: < 5 seconds
- Concurrent requests: 50+
- Uptime target: 99.9%

## Error Handling

The service includes comprehensive error handling:

- **Input Validation**: Validates text length and block count
- **API Failures**: Falls back to rule-based processing
- **Timeouts**: 30-second timeout with proper error response
- **Rate Limiting**: Returns 429 status when limit exceeded

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

[Your License Here]

## Support

For issues, questions, or contributions, please open an issue on the repository.