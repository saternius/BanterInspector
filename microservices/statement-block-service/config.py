import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Model selection - default to Gemini
    MODEL_PROVIDER = os.getenv('MODEL_PROVIDER', 'gemini').lower()  # 'claude' or 'gemini'
    
    # API Keys
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
    
    # Validate API key based on selected model
    if MODEL_PROVIDER == 'claude' and not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY environment variable is required for Claude model")
    elif MODEL_PROVIDER == 'gemini' and not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY environment variable is required for Gemini model")
    elif MODEL_PROVIDER not in ['claude', 'gemini']:
        raise ValueError("MODEL_PROVIDER must be either 'claude' or 'gemini'")
    
    # Redis
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
    
    # Text processing limits
    MAX_TEXT_LENGTH = int(os.getenv('MAX_TEXT_LENGTH', '10000'))
    MAX_BLOCKS = int(os.getenv('MAX_BLOCKS', '50'))
    
    # Request configuration
    REQUEST_TIMEOUT = int(os.getenv('REQUEST_TIMEOUT', '30'))
    
    # Rate limiting
    RATE_LIMIT_ENABLED = os.getenv('RATE_LIMIT_ENABLED', 'true').lower() == 'true'
    RATE_LIMIT_CALLS = int(os.getenv('RATE_LIMIT_CALLS', '100'))
    RATE_LIMIT_PERIOD = int(os.getenv('RATE_LIMIT_PERIOD', '3600'))  # 1 hour in seconds
    
    # Flask configuration
    FLASK_ENV = os.getenv('FLASK_ENV', 'production')
    DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    
    # Claude model configuration
    CLAUDE_MODEL = os.getenv('CLAUDE_MODEL', 'claude-3-5-sonnet-20241022')
    CLAUDE_MAX_TOKENS = int(os.getenv('CLAUDE_MAX_TOKENS', '4096'))
    CLAUDE_TEMPERATURE = float(os.getenv('CLAUDE_TEMPERATURE', '0.3'))
    
    # Gemini model configuration
    GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
    GEMINI_MAX_TOKENS = int(os.getenv('GEMINI_MAX_TOKENS', '4096'))
    GEMINI_TEMPERATURE = float(os.getenv('GEMINI_TEMPERATURE', '0.3'))