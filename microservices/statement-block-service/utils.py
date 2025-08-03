import re
import json
import time
from functools import wraps
from flask import jsonify

def sanitize_input(text):
    """Sanitize user input to prevent injection attacks."""
    if not isinstance(text, str):
        return ""
    # Remove any potential control characters
    text = re.sub(r'[\x00-\x1F\x7F-\x9F]', '', text)
    return text.strip()

def parse_claude_response(response_text):
    """
    Parse Claude's response to extract statement blocks.
    Tries multiple strategies to extract a valid array.
    """
    # Strategy 1: Direct JSON parse
    try:
        data = json.loads(response_text)
        if isinstance(data, list):
            return [str(item) for item in data if item]
    except json.JSONDecodeError:
        pass
    
    # Strategy 2: Extract JSON array using regex
    json_match = re.search(r'\[[\s\S]*\]', response_text)
    if json_match:
        try:
            data = json.loads(json_match.group())
            if isinstance(data, list):
                return [str(item) for item in data if item]
        except json.JSONDecodeError:
            pass
    
    # Strategy 3: Look for quoted strings
    quoted_strings = re.findall(r'"([^"]+)"', response_text)
    if quoted_strings:
        return [s.strip() for s in quoted_strings if s.strip()]
    
    # Strategy 4: Split by newlines and clean
    lines = response_text.strip().split('\n')
    blocks = []
    for line in lines:
        # Remove bullet points, numbers, quotes
        clean_line = re.sub(r'^[\s\-\*\d\.\)]+', '', line)
        clean_line = clean_line.strip().strip('"\'')
        if clean_line and len(clean_line) > 10:
            blocks.append(clean_line)
    
    return blocks if blocks else None

def timer_decorator(func):
    """Decorator to measure function execution time."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        processing_time_ms = int((end_time - start_time) * 1000)
        
        # If result is a tuple, add processing time
        if isinstance(result, tuple) and len(result) == 2:
            data, status_code = result
            if isinstance(data, dict):
                data['processing_time_ms'] = processing_time_ms
            return data, status_code
        
        # If result is a dict, add processing time
        if isinstance(result, dict):
            result['processing_time_ms'] = processing_time_ms
            
        return result
    return wrapper

def create_error_response(message, status_code=400, details=None):
    """Create a standardized error response."""
    error_data = {
        'error': message,
        'status_code': status_code
    }
    
    if details and Config.DEBUG:
        error_data['details'] = details
        
    return jsonify(error_data), status_code

def validate_request_data(data):
    """Validate incoming request data."""
    errors = []
    
    if not data:
        errors.append("Request body is required")
        return errors
    
    if 'text' not in data:
        errors.append("'text' field is required")
    elif not isinstance(data.get('text'), str):
        errors.append("'text' must be a string")
    elif len(data.get('text', '')) > Config.MAX_TEXT_LENGTH:
        errors.append(f"'text' exceeds maximum length of {Config.MAX_TEXT_LENGTH} characters")
        
    if 'intent' in data:
        if not isinstance(data.get('intent'), str):
            errors.append("'intent' must be a string")
        elif len(data.get('intent', '')) > Config.MAX_INTENT_LENGTH:
            errors.append(f"'intent' exceeds maximum length of {Config.MAX_INTENT_LENGTH} characters")
    
    if 'existing_blocks' in data:
        if not isinstance(data.get('existing_blocks'), list):
            errors.append("'existing_blocks' must be an array")
        elif len(data.get('existing_blocks', [])) > Config.MAX_BLOCKS:
            errors.append(f"'existing_blocks' exceeds maximum of {Config.MAX_BLOCKS} blocks")
        else:
            for i, block in enumerate(data.get('existing_blocks', [])):
                if not isinstance(block, str):
                    errors.append(f"'existing_blocks[{i}]' must be a string")
    
    return errors

# Import Config after defining functions to avoid circular import
from config import Config