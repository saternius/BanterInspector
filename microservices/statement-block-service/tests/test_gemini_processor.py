import pytest
from unittest.mock import Mock, patch
from gemini_processor import GeminiProcessor

class TestGeminiProcessor:
    
    @pytest.fixture
    def processor(self):
        with patch('gemini_processor.genai'):
            return GeminiProcessor()
    
    def test_process_empty_text(self, processor):
        """Test processing empty text returns existing blocks or empty list."""
        result = processor.process_text("")
        assert result == []
        
        result = processor.process_text("", ["existing block"])
        assert result == ["existing block"]
    
    def test_process_text_success(self, processor):
        """Test successful text processing."""
        mock_response = Mock()
        mock_response.text = '["Clean statement one.", "Clean statement two."]'
        processor.model.generate_content.return_value = mock_response
        
        result = processor.process_text("um so like the first thing and uh the second thing")
        
        assert result == ["Clean statement one.", "Clean statement two."]
        processor.model.generate_content.assert_called_once()
    
    def test_process_text_with_existing_blocks(self, processor):
        """Test processing with existing blocks."""
        mock_response = Mock()
        mock_response.text = '["Updated first block.", "Clean statement two."]'
        processor.model.generate_content.return_value = mock_response
        
        result = processor.process_text(
            "the first thing should be updated", 
            ["Original first block."]
        )
        
        assert result == ["Updated first block.", "Clean statement two."]
    
    def test_process_text_api_error(self, processor):
        """Test handling of API errors."""
        processor.model.generate_content.side_effect = Exception("API Error")
        
        result = processor.process_text("This is a test.")
        
        # Should return fallback processing
        assert len(result) > 0
        assert isinstance(result, list)
    
    def test_fallback_processing(self, processor):
        """Test fallback processing logic."""
        text = "This is the first sentence. This is the second sentence. And this is the third."
        result = processor._fallback_processing(text, [])
        
        assert isinstance(result, list)
        assert len(result) > 0
        assert all(isinstance(block, str) for block in result)
    
    def test_fallback_with_filler_words(self, processor):
        """Test fallback removes filler words."""
        text = "Um, so like, this is basically the first thing. You know, I mean, the second thing."
        result = processor._fallback_processing(text, [])
        
        assert isinstance(result, list)
        # Check that filler words are removed
        combined = ' '.join(result).lower()
        assert 'um' not in combined
        assert 'basically' not in combined
        assert 'you know' not in combined
    
    def test_build_prompt(self, processor):
        """Test prompt building."""
        prompt = processor._build_prompt("New text", ["Existing block"])
        
        assert "New text" in prompt
        assert "Existing block" in prompt
        assert "JSON array" in prompt
    
    def test_max_blocks_limit(self, processor):
        """Test that response is limited to MAX_BLOCKS."""
        # Create response with too many blocks
        many_blocks = [f"Block {i}" for i in range(100)]
        mock_response = Mock()
        mock_response.text = str(many_blocks)
        processor.model.generate_content.return_value = mock_response
        
        with patch('config.Config.MAX_BLOCKS', 10):
            result = processor.process_text("Generate many blocks")
            assert len(result) <= 10