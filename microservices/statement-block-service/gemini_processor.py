import json
import logging
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from config import Config
from utils import parse_claude_response, sanitize_input

logger = logging.getLogger(__name__)

class GeminiProcessor:
    def __init__(self):
        genai.configure(api_key=Config.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel(Config.GEMINI_MODEL)
        self.max_tokens = Config.GEMINI_MAX_TOKENS
        self.temperature = Config.GEMINI_TEMPERATURE
        
    def process_text(self, text, existing_blocks=None, intent=None):
        """
        Process text using Gemini to create organized statement blocks.
        
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
            # Configure generation settings
            generation_config = genai.types.GenerationConfig(
                max_output_tokens=self.max_tokens,
                temperature=self.temperature,
            )
            
            # Safety settings - allow all content for processing
            safety_settings = {
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            }
            #print(f"Prompt: {prompt}")
            # Call Gemini API
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config,
                # safety_settings=safety_settings
            )
            print(f"Response: {response}")
            # Extract the response text from Gemini response object
            if hasattr(response, 'text'):
                response_text = response.text
            elif hasattr(response, 'candidates') and response.candidates:
                # Access the first candidate's content
                response_text = response.candidates[0].content.parts[0].text
            else:
                logger.error("Unable to extract text from Gemini response")
                return self._fallback_processing(text, existing_blocks)
                
            print(f"Gemini response: {response_text}")
            
            # Parse the response (reuse the same parser)
            blocks = parse_claude_response(response_text)
            print(f"Blocks: {blocks}")
            if blocks:
                # Limit to MAX_BLOCKS
                return blocks[:Config.MAX_BLOCKS]
            else:
                # Fallback: return original text as single block
                print("Failed to parse Gemini response, using fallback")
                return self._fallback_processing(text, existing_blocks)
                
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            return self._fallback_processing(text, existing_blocks)
    
    def _build_prompt(self, text, existing_blocks, intent):
        """Build the prompt for Gemini."""
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
        """Fallback processing when Gemini API fails."""
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

    def format_blend2end(self, text, existing_form=None, intent=None):
        """
        Format text into Blend2End specification format.

        Args:
            text: The new text to process
            existing_form: Dictionary with existing form data (description, functionality, style)
            intent: The intent/context of the text

        Returns:
            Dictionary with description, functionality (array), and style fields
        """
        if not text or not text.strip():
            return existing_form or {"description": "", "functionality": [], "style": ""}

        # Sanitize inputs
        text = sanitize_input(text)
        intent = sanitize_input(intent) if intent else ""

        # Initialize existing form
        if not existing_form:
            existing_form = {"description": "", "functionality": [], "style": ""}

        # Build the prompt
        prompt = self._build_blend2end_prompt(text, existing_form, intent)

        try:
            # Configure generation settings
            generation_config = genai.types.GenerationConfig(
                max_output_tokens=self.max_tokens,
                temperature=self.temperature,
            )

            # Call Gemini API
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config,
            )

            # Extract the response text from Gemini response object
            if hasattr(response, 'text'):
                response_text = response.text
            elif hasattr(response, 'candidates') and response.candidates:
                response_text = response.candidates[0].content.parts[0].text
            else:
                logger.error("Unable to extract text from Gemini response")
                return self._fallback_blend2end_processing(text, existing_form)

            logger.debug(f"Gemini blend2end response: {response_text}")

            # Parse the response as JSON
            result = self._parse_blend2end_response(response_text)

            if result:
                return result
            else:
                # Fallback: return existing form with text appended
                logger.warning("Failed to parse Gemini blend2end response, using fallback")
                return self._fallback_blend2end_processing(text, existing_form)

        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            return self._fallback_blend2end_processing(text, existing_form)

    def _build_blend2end_prompt(self, text, existing_form, intent):
        """Build the prompt for Blend2End formatting."""
        prompt = """You are a text processing assistant that converts unstructured dialogue into structured 3D object specifications for the Blend2End system.

Your task:
1. Extract or update the object description (what the object is)
2. Extract or update functionality requirements (array of specific behaviors)
3. Extract or update the style (aesthetic/design style)
4. Merge new information with existing form data

Rules:
- description: A clear, concise description of the object (1-2 sentences)
- functionality: An array of specific functional requirements (e.g., "Drawers should be grabbable and slide open")
- style: The aesthetic or design style (e.g., "Modern minimalist", "Victorian", "Industrial")
- Preserve existing form data unless the new text explicitly replaces it
- If new text adds functionality, append to the existing functionality array
- Return ONLY a JSON object with these three fields, no explanation

"""
        if intent:
            prompt += f"Context:\n\"{intent}\"\n\n"

        if existing_form and (existing_form.get('description') or existing_form.get('functionality') or existing_form.get('style')):
            prompt += f"Existing form data:\n{json.dumps(existing_form, indent=2)}\n\n"

        prompt += f"New text to process:\n\"{text}\"\n\n"
        prompt += "Return a JSON object with description, functionality (array), and style fields:"

        return prompt

    def _parse_blend2end_response(self, response_text):
        """Parse Gemini's blend2end response to extract the object specification."""
        # Strategy 1: Direct JSON parse
        try:
            data = json.loads(response_text)
            if isinstance(data, dict) and 'description' in data:
                # Ensure all required fields exist
                result = {
                    'description': data.get('description', ''),
                    'functionality': data.get('functionality', []),
                    'style': data.get('style', '')
                }
                # Ensure functionality is a list
                if not isinstance(result['functionality'], list):
                    result['functionality'] = [str(result['functionality'])]
                return result
        except json.JSONDecodeError:
            pass

        # Strategy 2: Extract JSON object using regex
        import re
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            try:
                data = json.loads(json_match.group())
                if isinstance(data, dict):
                    result = {
                        'description': data.get('description', ''),
                        'functionality': data.get('functionality', []),
                        'style': data.get('style', '')
                    }
                    if not isinstance(result['functionality'], list):
                        result['functionality'] = [str(result['functionality'])]
                    return result
            except json.JSONDecodeError:
                pass

        return None

    def _fallback_blend2end_processing(self, text, existing_form):
        """Fallback processing when Gemini API fails."""
        # Simple fallback: try to intelligently update the form
        result = {
            'description': existing_form.get('description', ''),
            'functionality': existing_form.get('functionality', []).copy() if existing_form.get('functionality') else [],
            'style': existing_form.get('style', '')
        }

        # If description is empty, use the text as description
        if not result['description']:
            result['description'] = text
        else:
            # Otherwise, add text as a functionality item
            result['functionality'].append(text)

        return result