import json
import logging
from anthropic import Anthropic, APIError, APITimeoutError
from config import Config
from utils import parse_claude_response, sanitize_input

logger = logging.getLogger(__name__)

class ClaudeProcessor:
    def __init__(self):
        self.client = Anthropic(api_key=Config.ANTHROPIC_API_KEY)
        self.model = Config.CLAUDE_MODEL
        self.max_tokens = Config.CLAUDE_MAX_TOKENS
        self.temperature = Config.CLAUDE_TEMPERATURE
    
    def process_text(self, text, existing_blocks=None, intent=None):
        """
        Process text using Claude to create organized statement blocks.
        
        Args:
            text: The new text to process
            existing_blocks: List of existing statement blocks to merge with
            intent: The intent of the text
            
        Returns:
            List of processed statement blocks
        """
        if not text or not text.strip():
            return existing_blocks or []
        
        # Sanitize inputs
        text = sanitize_input(text)
        intent = sanitize_input(intent)
        if existing_blocks:
            existing_blocks = [sanitize_input(block) for block in existing_blocks]
        
        # Build the prompt
        prompt = self._build_prompt(text, existing_blocks, intent)
        
        try:
            # Call Claude API
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            # Extract the response text
            response_text = response.content[0].text
            logger.debug(f"Claude response: {response_text}")
            
            # Parse the response
            blocks = parse_claude_response(response_text)
            
            if blocks:
                # Limit to MAX_BLOCKS
                return blocks[:Config.MAX_BLOCKS]
            else:
                # Fallback: return original text as single block
                logger.warning("Failed to parse Claude response, using fallback")
                return self._fallback_processing(text, existing_blocks)
                
        except APITimeoutError:
            logger.error("Claude API timeout")
            return self._fallback_processing(text, existing_blocks)
            
        except APIError as e:
            logger.error(f"Claude API error: {str(e)}")
            return self._fallback_processing(text, existing_blocks)
            
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return self._fallback_processing(text, existing_blocks)
    
    def _build_prompt(self, text, existing_blocks, intent):
        """Build the prompt for Claude."""
        prompt = """You are a text processing assistant that organizes unstructured text into clear, concise statement blocks.

Your task:
1. Break the new text into distinct thoughts or statements (1-3 sentences each)
2. Clean up speech artifacts (um, uh, like, you know, etc.)
3. Fix grammar while preserving the original meaning
4. If existing blocks are provided, intelligently merge related ideas
5. Each block should express one complete idea

Rules:
- Maximum 3 sentences per block
- Preserve the speaker's intent and meaning
- Remove filler words and fix grammar
- Merge similar ideas from new text with existing blocks
- Return ONLY a JSON array of strings, no explanation

"""
        if intent:
            prompt += f"Speaking context:\n\"{intent}\"\n\n"
        
        if existing_blocks:
            prompt += f"Existing blocks:\n{json.dumps(existing_blocks, indent=2)}\n\n"
        
        prompt += f"New text to process:\n\"{text}\"\n\n"
        prompt += "Return a JSON array of processed statement blocks:"
        
        return prompt
    
    def _fallback_processing(self, text, existing_blocks):
        """Fallback processing when Claude API fails."""
        # Simple fallback: split by sentences and clean
        import re
        
        # Split into sentences
        sentences = re.split(r'[.!?]+', text)
        
        blocks = []
        current_block = []
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            # Remove common filler words
            sentence = re.sub(r'\b(um|uh|like|you know|I mean|basically|actually)\b', '', sentence, flags=re.IGNORECASE)
            sentence = re.sub(r'\s+', ' ', sentence).strip()
            
            if sentence:
                current_block.append(sentence)
                
                # Group 1-3 sentences per block
                if len(current_block) >= 2:
                    blocks.append('. '.join(current_block) + '.')
                    current_block = []
        
        # Add remaining sentences
        if current_block:
            blocks.append('. '.join(current_block) + '.')
        
        # If we have existing blocks, prepend them
        if existing_blocks:
            return existing_blocks + blocks
        
        return blocks if blocks else [text]