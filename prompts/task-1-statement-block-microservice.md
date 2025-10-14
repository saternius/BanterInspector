# Task 1: Statement Block Processing Microservice

## Objective
Build a Flask-based microservice that uses Claude Sonnet 3.5 to process unstructured text into organized statement blocks. This service should be general-purpose and reusable across different contexts.

## Deliverables

### 1. Flask Application Structure
Create a new repository/folder with the following structure:
```
statement-block-service/
├── app.py
├── requirements.txt
├── config.py
├── claude_processor.py
├── utils.py
├── tests/
│   ├── test_app.py
│   └── test_processor.py
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

### 2. Core API Endpoint
Implement a single POST endpoint at `/process-text` with:

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

### 3. Required Features

#### Claude Integration
- Use Claude Sonnet 3.5 (model: "claude-3-5-sonnet-20241022")
- Implement smart prompting that:
  - Breaks text into coherent statement blocks
  - Cleans up grammar while preserving meaning
  - Handles merging with existing blocks intelligently
  - Each block should be 1-3 sentences max

#### Error Handling
- Graceful fallback if Claude API fails
- Input validation (max 10k chars, max 50 blocks)
- Proper HTTP status codes
- Detailed error messages in development, generic in production

#### Performance & Reliability
- Request timeout of 30 seconds
- Rate limiting (100 requests/hour per IP)
- Health check endpoint at `/health`
- Logging for debugging and monitoring

### 4. Dependencies (requirements.txt)
```
flask==3.0.0
flask-cors==4.0.0
anthropic==0.18.1
python-dotenv==1.0.0
gunicorn==21.2.0
redis==5.0.1
ratelimit==2.2.1
pytest==7.4.3
pytest-flask==1.3.0
```

### 5. Configuration
Environment variables to support:
- `ANTHROPIC_API_KEY` (required)
- `REDIS_URL` (optional, defaults to localhost)
- `MAX_TEXT_LENGTH` (default: 10000)
- `MAX_BLOCKS` (default: 50)
- `REQUEST_TIMEOUT` (default: 30)
- `RATE_LIMIT_ENABLED` (default: true)
- `RATE_LIMIT_CALLS` (default: 100)
- `RATE_LIMIT_PERIOD` (default: 3600)

### 6. Docker Support
- Dockerfile for containerization
- docker-compose.yml with Redis service
- Expose port 5000
- Use gunicorn with 4 workers

### 7. Testing Requirements
- Unit tests for text processing logic
- API integration tests
- Test edge cases:
  - Empty text
  - Very long text
  - Invalid JSON
  - Rate limiting
  - Claude API timeout

### 8. Documentation (README.md)
Include:
- Setup instructions
- API documentation with examples
- Deployment guide
- Configuration options
- Example cURL commands

## Technical Specifications

### Claude Prompt Engineering
The prompt should instruct Claude to:
1. Identify distinct thoughts/statements in the text
2. Clean up speech artifacts (um, uh, like, etc.)
3. Fix grammar without changing meaning
4. Merge related ideas from new text with existing blocks
5. Return a JSON array of strings

### Response Parsing
- Primary: Parse JSON from Claude's response
- Fallback 1: Extract array using regex
- Fallback 2: Split by newlines and clean
- Last resort: Return original text as single block

### Security Considerations
- Sanitize all inputs
- No execution of user-provided code
- API key must never be exposed
- Use HTTPS in production
- Implement request signing for production use

## Example Usage

### Basic Request
```bash
curl -X POST http://localhost:5000/process-text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "So I was using the app and like the menu is really hard to find you know and also the colors are too bright it hurts my eyes",
    "existing_blocks": []
  }'
```

### Expected Response
```json
{
    "blocks": [
        "The menu is difficult to find in the app.",
        "The color scheme is too bright and causes eye strain."
    ],
    "processing_time_ms": 1543
}
```

### Adding to Existing Blocks
```bash
curl -X POST http://localhost:5000/process-text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Oh and the menu should have icons not just text",
    "existing_blocks": [
        "The menu is difficult to find in the app.",
        "The color scheme is too bright and causes eye strain."
    ]
  }'
```

### Expected Response
```json
{
    "blocks": [
        "The menu is difficult to find in the app and should include icons instead of just text.",
        "The color scheme is too bright and causes eye strain."
    ],
    "processing_time_ms": 1821
}
```

## Performance Targets
- Average response time: < 2 seconds
- 99th percentile: < 5 seconds
- Uptime: 99.9%
- Concurrent requests: 50+

## Deployment Notes
- Use environment variables for all configuration
- Enable CORS for browser-based clients
- Set up monitoring (response times, error rates)
- Implement graceful shutdown
- Use a reverse proxy (nginx) in production
- Enable gzip compression

## Success Criteria
1. Service processes text accurately into logical blocks
2. Handles existing blocks intelligently
3. Responds within 5 seconds for typical requests
4. Includes comprehensive error handling
5. Passes all unit and integration tests
6. Includes clear documentation
7. Ready for production deployment