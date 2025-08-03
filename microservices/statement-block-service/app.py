import logging
import time
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
import redis
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import Config
from utils import validate_request_data, create_error_response, timer_decorator

# Set up logging
logging.basicConfig(
    level=logging.DEBUG if Config.DEBUG else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS
CORS(app)

# Initialize the appropriate processor based on config
if Config.MODEL_PROVIDER == 'claude':
    from claude_processor import ClaudeProcessor
    text_processor = ClaudeProcessor()
    logger.info("Using Claude model for text processing")
elif Config.MODEL_PROVIDER == 'gemini':
    from gemini_processor import GeminiProcessor
    text_processor = GeminiProcessor()
    logger.info("Using Gemini model for text processing")
else:
    raise ValueError(f"Unknown model provider: {Config.MODEL_PROVIDER}")

# Set up rate limiter
limiter = None
if Config.RATE_LIMIT_ENABLED:
    try:
        redis_client = redis.from_url(Config.REDIS_URL)
        redis_client.ping()
        limiter = Limiter(
            app=app,
            key_func=get_remote_address,
            default_limits=[f"{Config.RATE_LIMIT_CALLS} per {Config.RATE_LIMIT_PERIOD} seconds"],
            storage_uri=Config.REDIS_URL
        )
        logger.info("Rate limiting enabled with Redis")
    except Exception as e:
        logger.warning(f"Redis connection failed: {str(e)}. Using in-memory rate limiting.")
        limiter = Limiter(
            app=app,
            key_func=get_remote_address,
            default_limits=[f"{Config.RATE_LIMIT_CALLS} per {Config.RATE_LIMIT_PERIOD} seconds"]
        )
else:
    # Create a dummy limiter that doesn't actually limit
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        enabled=False
    )

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    health_status = {
        'status': 'healthy',
        'service': 'statement-block-service',
        'version': '1.0.0',
        'model_provider': Config.MODEL_PROVIDER
    }
    
    # Check Redis connection if rate limiting is enabled
    if Config.RATE_LIMIT_ENABLED and limiter:
        health_status['rate_limiting'] = 'enabled'
        try:
            # Try to check if Redis is being used
            if hasattr(limiter, '_storage') and hasattr(limiter._storage, '_client'):
                limiter._storage._client.ping()
                health_status['redis'] = 'connected'
            else:
                health_status['redis'] = 'in-memory'
        except Exception:
            health_status['redis'] = 'disconnected'
            health_status['status'] = 'degraded'
    
    return jsonify(health_status), 200 if health_status['status'] == 'healthy' else 503

@app.route('/process-text', methods=['POST'])
@limiter.limit(f"{Config.RATE_LIMIT_CALLS} per {Config.RATE_LIMIT_PERIOD} seconds")
@timer_decorator
def process_text():
    """Main endpoint to process text into statement blocks."""
    # Get request data
    try:
        data = request.get_json()
    except Exception:
        return create_error_response("Invalid JSON in request body", status_code=400)
    
    # Validate request data
    validation_errors = validate_request_data(data)
    if validation_errors:
        return create_error_response(
            "Validation failed",
            status_code=400,
            details=validation_errors
        )
    
    # Extract parameters
    text = data.get('text', '').strip()
    existing_blocks = data.get('existing_blocks', [])
    intent = data.get('intent', '')
    
    # Process the text
    try:
        # Set timeout for the entire operation
        start_time = time.time()
        print(f"Processing text: {text}, existing_blocks: {existing_blocks}, intent: {intent}", text_processor)
        blocks = text_processor.process_text(text, existing_blocks, intent)
        
        # Check if we exceeded timeout
        if time.time() - start_time > Config.REQUEST_TIMEOUT:
            return create_error_response(
                "Request timeout exceeded",
                status_code=504
            )
        
        # Return successful response
        return {
            'blocks': blocks
        }, 200
        
    except Exception as e:
        logger.error(f"Error processing text: {str(e)}", exc_info=True)
        return create_error_response(
            "An error occurred while processing the text",
            status_code=500,
            details=str(e) if Config.DEBUG else None
        )

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return create_error_response("Endpoint not found", status_code=404)

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {str(error)}", exc_info=True)
    return create_error_response(
        "Internal server error",
        status_code=500,
        details=str(error) if Config.DEBUG else None
    )

@app.before_request
def log_request():
    """Log incoming requests."""
    logger.debug(f"{request.method} {request.path} - {request.remote_addr}")

@app.after_request
def log_response(response):
    """Log response status."""
    logger.debug(f"Response: {response.status_code}")
    return response

if __name__ == '__main__':
    # Development server
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=Config.DEBUG
    )