# Mic Statement Block Editor Feature

## Overview
Enhance the feedback system's voice input by processing transcripts through an AI summarizer that converts stream-of-consciousness speech into structured statement blocks. Users can refine, delete, and augment these blocks before submission.

## User Flow

### 1. Initial Recording
- User clicks mic button and speaks naturally
- Real-time transcript appears as before
- User clicks mic again to stop recording

### 2. Processing Phase
- Loading indicator shows "Processing your feedback..."
- Transcript sent to microservice endpoint
- Microservice returns structured statement blocks
- Each block represents a coherent thought/issue/suggestion

### 3. Block Editor Interface
- Display statement blocks in an interactive editor
- Each block shows:
  - Block content (summarized/cleaned text)
  - Delete button (X)
  - Edit inline capability
- Option to view original transcript alongside blocks

### 4. Refinement Actions
- **Delete blocks**: Remove irrelevant or redundant blocks
- **Edit blocks**: Click to edit text inline
- **Add context**: Click mic to record additional details
  - New recording can either:
    - Create new blocks (processed)
    - Append to selected block (raw)
- **Reorder blocks**: Drag and drop to reorganize

### 5. Submission Options
- Submit refined blocks as structured feedback
- Submit original transcript (fallback option)
- Preview final submission before sending

## Flask Microservice Architecture

### Service Overview
A general-purpose text processing service using Claude Sonnet 3.7 that converts unstructured text into organized statement blocks. Designed to be reusable across different contexts beyond feedback.

### Flask Server Implementation

#### Project Structure
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
└── .env.example
```

#### requirements.txt
```
flask==3.0.0
flask-cors==4.0.0
anthropic==0.18.1
python-dotenv==1.0.0
gunicorn==21.2.0
redis==5.0.1
ratelimit==2.2.1
```

#### app.py
```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from claude_processor import ClaudeProcessor
from utils import validate_input, rate_limit
import logging
import os

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize processor
processor = ClaudeProcessor()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "version": "1.0.0"})

@app.route('/process-text', methods=['POST'])
@rate_limit(calls=100, period=3600)  # 100 calls per hour
def process_text():
    """
    Process unstructured text into statement blocks.
    
    Request body:
    {
        "text": "string - the new text to process",
        "existing_blocks": ["array", "of", "existing", "statement", "blocks"]
    }
    
    Response:
    {
        "blocks": ["array", "of", "processed", "statement", "blocks"],
        "processing_time_ms": 1234
    }
    """
    try:
        # Validate input
        data = request.get_json()
        validation_error = validate_input(data)
        if validation_error:
            return jsonify({"error": validation_error}), 400
        
        text = data.get('text', '').strip()
        existing_blocks = data.get('existing_blocks', [])
        
        # Process with Claude
        start_time = time.time()
        blocks = processor.process_text(text, existing_blocks)
        processing_time = int((time.time() - start_time) * 1000)
        
        return jsonify({
            "blocks": blocks,
            "processing_time_ms": processing_time
        })
        
    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        return jsonify({"error": "Internal processing error"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
```

#### claude_processor.py
```python
import anthropic
import os
import json
import re
from typing import List
import logging

logger = logging.getLogger(__name__)

class ClaudeProcessor:
    def __init__(self):
        self.client = anthropic.Anthropic(
            api_key=os.environ.get('ANTHROPIC_API_KEY')
        )
        
    def process_text(self, new_text: str, existing_blocks: List[str]) -> List[str]:
        """
        Process text into statement blocks using Claude Sonnet 3.7
        """
        if not new_text and existing_blocks:
            return existing_blocks
        
        if not new_text:
            return []
            
        prompt = self._build_prompt(new_text, existing_blocks)
        
        try:
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2048,
                temperature=0.3,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            # Parse response
            blocks = self._parse_response(response.content[0].text)
            return blocks
            
        except Exception as e:
            logger.error(f"Claude API error: {str(e)}")
            # Fallback: return original text as single block
            return existing_blocks + [new_text] if existing_blocks else [new_text]
    
    def _build_prompt(self, new_text: str, existing_blocks: List[str]) -> str:
        """Build the prompt for Claude"""
        
        if existing_blocks:
            return f"""You are a text processor that converts stream-of-consciousness text into clear, concise statement blocks.

Existing statement blocks:
{json.dumps(existing_blocks, indent=2)}

New text to process:
"{new_text}"

Instructions:
1. Analyze the new text and break it into distinct, coherent statements
2. Each statement should represent one complete thought, issue, or idea
3. Clean up grammar and clarity while preserving the original meaning
4. Remove filler words, repetitions, and unnecessary verbosity
4. If the new text relates to or expands on existing blocks, merge appropriately
5. Maintain all existing blocks unless the new text explicitly contradicts them
6. Each block should be 1-3 sentences maximum

Return ONLY a JSON array of statement strings. Example:
["First clear statement", "Second distinct point", "Third separate idea"]"""
        else:
            return f"""You are a text processor that converts stream-of-consciousness text into clear, concise statement blocks.

Text to process:
"{new_text}"

Instructions:
1. Break the text into distinct, coherent statements
2. Each statement should represent one complete thought, issue, or idea
3. Clean up grammar and clarity while preserving the original meaning
4. Remove filler words, repetitions, and unnecessary verbosity
5. Each block should be 1-3 sentences maximum

Return ONLY a JSON array of statement strings. Example:
["First clear statement", "Second distinct point", "Third separate idea"]"""
    
    def _parse_response(self, response_text: str) -> List[str]:
        """Parse Claude's response into a list of blocks"""
        try:
            # Try to extract JSON array from response
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                blocks = json.loads(json_match.group())
                # Validate and clean blocks
                return [str(block).strip() for block in blocks if block and str(block).strip()]
        except:
            pass
        
        # Fallback: split by newlines
        lines = response_text.strip().split('\n')
        blocks = []
        for line in lines:
            line = line.strip()
            # Remove bullet points, numbers, etc.
            line = re.sub(r'^[-•*]\s*', '', line)
            line = re.sub(r'^\d+\.\s*', '', line)
            if line and len(line) > 10:
                blocks.append(line)
        
        return blocks
```

#### config.py
```python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379')
    MAX_TEXT_LENGTH = int(os.environ.get('MAX_TEXT_LENGTH', 10000))
    MAX_BLOCKS = int(os.environ.get('MAX_BLOCKS', 50))
    REQUEST_TIMEOUT = int(os.environ.get('REQUEST_TIMEOUT', 30))
    
    # Rate limiting
    RATE_LIMIT_ENABLED = os.environ.get('RATE_LIMIT_ENABLED', 'true').lower() == 'true'
    RATE_LIMIT_CALLS = int(os.environ.get('RATE_LIMIT_CALLS', 100))
    RATE_LIMIT_PERIOD = int(os.environ.get('RATE_LIMIT_PERIOD', 3600))
```

#### utils.py
```python
from functools import wraps
from flask import request, jsonify
import redis
import time
import hashlib

def validate_input(data):
    """Validate request input"""
    if not isinstance(data, dict):
        return "Request body must be JSON object"
    
    text = data.get('text', '')
    existing_blocks = data.get('existing_blocks', [])
    
    if not isinstance(text, str):
        return "Text must be a string"
    
    if not isinstance(existing_blocks, list):
        return "existing_blocks must be an array"
    
    if len(text) > 10000:
        return "Text exceeds maximum length of 10000 characters"
    
    if len(existing_blocks) > 50:
        return "Maximum 50 existing blocks allowed"
    
    for block in existing_blocks:
        if not isinstance(block, str):
            return "All blocks must be strings"
    
    return None

def rate_limit(calls=100, period=3600):
    """Rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if not Config.RATE_LIMIT_ENABLED:
                return f(*args, **kwargs)
                
            # Get client identifier
            client_id = request.headers.get('X-API-Key', request.remote_addr)
            key = f"rate_limit:{client_id}:{f.__name__}"
            
            try:
                r = redis.from_url(Config.REDIS_URL)
                current = r.incr(key)
                if current == 1:
                    r.expire(key, period)
                
                if current > calls:
                    return jsonify({
                        "error": "Rate limit exceeded",
                        "retry_after": r.ttl(key)
                    }), 429
                    
            except redis.RedisError:
                # If Redis is down, allow the request
                pass
                
            return f(*args, **kwargs)
        return wrapped
    return decorator
```

#### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "30", "app:app"]
```

#### .env.example
```
ANTHROPIC_API_KEY=your_api_key_here
REDIS_URL=redis://localhost:6379
MAX_TEXT_LENGTH=10000
MAX_BLOCKS=50
REQUEST_TIMEOUT=30
RATE_LIMIT_ENABLED=true
RATE_LIMIT_CALLS=100
RATE_LIMIT_PERIOD=3600
```

### Deployment Considerations

#### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export ANTHROPIC_API_KEY=your_key_here

# Run Flask app
python app.py
```

#### Production Deployment
```bash
# Using Docker
docker build -t statement-block-service .
docker run -p 5000:5000 --env-file .env statement-block-service

# Using Gunicorn directly
gunicorn --bind 0.0.0.0:5000 --workers 4 --timeout 30 app:app
```

#### Nginx Configuration (optional)
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 30s;
    }
}
```

## Frontend Integration

### Updated API Integration
```javascript
class StatementBlockEditor {
    constructor() {
        this.blocks = [];
        this.originalTranscript = '';
        this.serviceUrl = 'https://your-service-url.com/process-text';
    }
    
    async processTranscript(transcript) {
        try {
            const response = await fetch(this.serviceUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: transcript,
                    existing_blocks: this.blocks
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.blocks = data.blocks;
            return this.blocks;
            
        } catch (error) {
            console.error('Failed to process transcript:', error);
            // Fallback: use original transcript as single block
            return [transcript];
        }
    }
}
```

### Error Handling Strategy
1. **Network Errors**: Show user-friendly message, offer retry
2. **Timeout**: After 10 seconds, offer to use raw transcript
3. **Service Errors**: Log for debugging, graceful fallback
4. **Rate Limiting**: Show remaining time, offer alternatives

## Testing the Microservice

### Unit Tests (test_processor.py)
```python
import unittest
from claude_processor import ClaudeProcessor

class TestClaudeProcessor(unittest.TestCase):
    def setUp(self):
        self.processor = ClaudeProcessor()
    
    def test_empty_text(self):
        result = self.processor.process_text("", [])
        self.assertEqual(result, [])
    
    def test_existing_blocks_preserved(self):
        existing = ["Block 1", "Block 2"]
        result = self.processor.process_text("", existing)
        self.assertEqual(result, existing)
    
    def test_new_text_processing(self):
        text = "This is a test. It has multiple sentences. Each should be a block."
        result = self.processor.process_text(text, [])
        self.assertIsInstance(result, list)
        self.assertTrue(len(result) > 0)
```

### API Tests (test_app.py)
```python
import unittest
import json
from app import app

class TestAPI(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
    
    def test_health_check(self):
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
    
    def test_process_text_valid(self):
        response = self.app.post('/process-text',
            data=json.dumps({
                "text": "Test text",
                "existing_blocks": []
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('blocks', data)
```

### Manual Testing with cURL
```bash
# Health check
curl http://localhost:5000/health

# Process text
curl -X POST http://localhost:5000/process-text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "So like I was trying to use the inspector and the hierarchy panel just doesnt update when I delete stuff and also it would be really cool if we could copy and paste components",
    "existing_blocks": []
  }'

# Add to existing blocks
curl -X POST http://localhost:5000/process-text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Oh and another thing the performance is really slow when I have lots of objects",
    "existing_blocks": [
      "The hierarchy panel doesn't update when deleting objects",
      "Feature request: Add copy/paste functionality for components"
    ]
  }'
```

## Performance Optimization

### Caching Strategy
- Cache processed results for identical inputs
- Use Redis with 1-hour TTL
- Key: hash of (text + existing_blocks)

### Scaling Considerations
- Horizontal scaling with load balancer
- Queue long-running requests with Celery
- Implement webhook callbacks for async processing
- Use connection pooling for Redis

### Monitoring
- Track processing times
- Monitor Claude API usage
- Alert on error rates > 5%
- Dashboard for usage statistics

## Security Best Practices

1. **API Authentication**: Implement API keys for production
2. **Input Sanitization**: Clean all user inputs
3. **Rate Limiting**: Per-IP and per-API-key limits
4. **HTTPS Only**: Enforce TLS for all connections
5. **Secrets Management**: Use environment variables or secret manager
6. **Audit Logging**: Log all requests with anonymized data

## Cost Optimization

### Claude API Usage
- Estimate: ~500 tokens per request (input + output)
- Claude Sonnet 3.5 pricing: $3/1M input, $15/1M output
- Expected cost: ~$0.01 per request
- Implement caching to reduce duplicate calls
- Consider batching multiple texts

### Infrastructure Costs
- Small Flask server: ~$20/month
- Redis instance: ~$15/month
- Load balancer: ~$20/month
- Total: ~$55/month for basic setup

## Future Enhancements

1. **Batch Processing**: Process multiple texts in one request
2. **Language Detection**: Auto-detect and process multiple languages
3. **Custom Instructions**: Allow context-specific processing rules
4. **Streaming Response**: Return blocks as they're processed
5. **Fine-tuning**: Train custom model for specific domains
6. **Analytics**: Track common patterns and improve processing