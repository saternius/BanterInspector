# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Flask-based microservice that uses AI models (Claude or Gemini) to process unstructured text into organized statement blocks. It's designed as a general-purpose text processing service that cleans up speech artifacts, fixes grammar, and intelligently organizes thoughts into coherent blocks.

## Project Type and Main Technologies

- **Python 3.11+** with Flask web framework
- **AI Models**: Anthropic Claude API or Google Gemini API (configurable)
- **Redis** for rate limiting (optional, falls back to in-memory)
- **pytest** for testing

## Common Development Commands

### Local Setup
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API key (GOOGLE_API_KEY for Gemini or ANTHROPIC_API_KEY for Claude)

# Run development server
python app.py
```

### Testing
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=.

# Run specific test file
pytest tests/test_app.py

# Run specific test class or method
pytest tests/test_app.py::TestHealthEndpoint::test_health_check_healthy
```

### Docker
```bash
# Build and run with Docker Compose (includes Redis)
docker-compose up --build

# Build standalone Docker image
docker build -t statement-block-service:latest .

# Run with environment file
docker run -p 5000:5000 --env-file .env statement-block-service:latest
```

### API Testing
```bash
# Health check
curl http://localhost:5000/health

# Process text
curl -X POST http://localhost:5000/process-text \
  -H "Content-Type: application/json" \
  -d '{"text": "um this is like a test", "existing_blocks": []}'
```

## Architecture

### Core Components

**Flask Application (`app.py`)**
- Main entry point and route definitions
- Initializes the appropriate processor (Claude or Gemini) based on `MODEL_PROVIDER` config
- Sets up CORS, rate limiting, and error handlers
- Two main endpoints: `/health` (GET) and `/process-text` (POST)

**Configuration System (`config.py`)**
- Centralized environment variable configuration using `python-dotenv`
- Validates required API keys based on selected model provider
- Defines all service limits (max text length, max blocks, timeouts, rate limits)
- Single source of truth for all configurable parameters

**Processor Architecture**
Two interchangeable processor implementations with identical interfaces:
- `claude_processor.py` - Uses Anthropic Claude API
- `gemini_processor.py` - Uses Google Gemini API

Both processors:
1. Accept `text`, `existing_blocks`, and optional `intent` parameters
2. Build identical prompts for the AI models
3. Parse AI responses into statement block arrays
4. Provide fallback processing when API calls fail
5. Implement the `process_text(text, existing_blocks, intent)` method

**Utilities (`utils.py`)**
- `sanitize_input()` - Removes control characters to prevent injection attacks
- `parse_claude_response()` - Multi-strategy response parser (works for both Claude and Gemini)
  - Strategy 1: Direct JSON parse
  - Strategy 2: Regex extraction of JSON array
  - Strategy 3: Extract quoted strings
  - Strategy 4: Split by newlines and clean
- `validate_request_data()` - Input validation for API requests
- `timer_decorator()` - Adds `processing_time_ms` to responses
- `create_error_response()` - Standardized error response format

### Key Design Patterns

**Processor Strategy Pattern**: The service selects between Claude and Gemini processors at startup based on `MODEL_PROVIDER` environment variable. Both implement the same interface, making them completely interchangeable.

**Fallback Processing**: If AI API calls fail (timeout, error, or unparseable response), processors fall back to rule-based text processing:
- Split text by sentence boundaries
- Remove filler words (um, uh, like, you know, etc.) using regex
- Group sentences into 1-3 sentence blocks
- Merge with existing blocks if provided

**Multi-Strategy Response Parsing**: The `parse_claude_response()` function tries multiple strategies to extract statement blocks from AI responses, making it robust to different response formats.

**Request Validation Pipeline**: All requests pass through validation before processing:
1. JSON parsing
2. Schema validation (required fields, types)
3. Length limits (text length, block count)
4. Sanitization (control character removal)

## Testing Architecture

Test suite uses pytest with fixtures for:
- `client` - Flask test client with rate limiting disabled
- `client_with_rate_limiting` - Flask test client with rate limiting enabled
- `mock_text_processor` - Mocked processor for testing without API calls

Test coverage includes:
- Health endpoint (basic, with/without Redis)
- Text processing (success, validation errors, edge cases)
- Rate limiting (enabled/disabled, limit exceeded)
- Error handlers (404, 500)
- Input validation (text length, block count, invalid types)

## Environment Configuration

Critical environment variables:
- `MODEL_PROVIDER` - Set to `claude` or `gemini` (default: `gemini`)
- `ANTHROPIC_API_KEY` or `GOOGLE_API_KEY` - Required based on chosen provider
- `REDIS_URL` - Redis connection (optional, falls back to in-memory rate limiting)
- `RATE_LIMIT_ENABLED` - Set to `false` to disable rate limiting entirely

## API Design

**POST /process-text**
- Accepts: `text` (required), `existing_blocks` (optional array), `intent` (optional string)
- Returns: `blocks` (array of strings), `processing_time_ms` (integer)
- AI processes text to organize into clear statement blocks (1-3 sentences each)
- Intelligently merges new text with existing blocks when provided
- Intent provides additional context for AI processing

**GET /health**
- Returns service status, version, model provider, Redis connection status
- Used for container health checks and monitoring

## Critical Development Considerations

**API Key Management**: The service validates at startup that the correct API key is present for the selected model provider. It will fail fast if the key is missing.

**Rate Limiting Flexibility**: Rate limiting works with or without Redis. If Redis is unavailable, it automatically falls back to in-memory rate limiting. Can be completely disabled via `RATE_LIMIT_ENABLED=false`.

**Timeout Handling**: Requests have a 30-second timeout (configurable via `REQUEST_TIMEOUT`). The service checks elapsed time after processing and returns 504 if exceeded.

**Debug Mode**: When `FLASK_DEBUG=true`, error responses include detailed error information. In production, only generic error messages are returned.

**Processor Selection**: The processor is selected once at startup. To switch between Claude and Gemini, change `MODEL_PROVIDER` and restart the service.

## Production Deployment Notes

- Use gunicorn in production: `gunicorn -w 4 -b 0.0.0.0:5000 app:app`
- Configure Redis for proper rate limiting across multiple instances
- Set up HTTPS via reverse proxy (nginx recommended)
- Enable health check monitoring on `/health` endpoint
- Set `FLASK_DEBUG=false` to hide error details from clients
