import pytest
import json
from unittest.mock import patch, Mock
from app import app
from config import Config

@pytest.fixture
def client():
    """Create a test client."""
    app.config['TESTING'] = True
    # Disable rate limiting for most tests
    with patch.object(Config, 'RATE_LIMIT_ENABLED', False):
        with app.test_client() as client:
            yield client

@pytest.fixture
def mock_text_processor():
    """Mock the text processor."""
    with patch('app.text_processor') as mock:
        yield mock

@pytest.fixture
def client_with_rate_limiting():
    """Create a test client with rate limiting enabled."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

class TestHealthEndpoint:
    
    def test_health_check_healthy(self, client):
        """Test health check returns healthy status."""
        response = client.get('/health')
        data = json.loads(response.data)
        
        assert response.status_code == 200
        assert data['status'] == 'healthy'
        assert data['service'] == 'statement-block-service'
        assert 'version' in data
        assert 'model_provider' in data
    
    def test_health_check_with_rate_limiting_enabled(self, client):
        """Test health check with rate limiting enabled."""
        with patch.object(Config, 'RATE_LIMIT_ENABLED', True):
            with patch('app.limiter') as mock_limiter:
                mock_limiter._storage._client.ping.return_value = True
                response = client.get('/health')
                data = json.loads(response.data)
                
                assert response.status_code == 200
                assert 'rate_limiting' in data
                assert data['rate_limiting'] == 'enabled'
    
    def test_health_check_with_rate_limiting_disabled(self, client):
        """Test health check with rate limiting disabled."""
        with patch.object(Config, 'RATE_LIMIT_ENABLED', False):
            response = client.get('/health')
            data = json.loads(response.data)
            
            assert response.status_code == 200
            assert 'rate_limiting' not in data

class TestProcessTextEndpoint:
    
    def test_process_text_success(self, client, mock_text_processor):
        """Test successful text processing."""
        mock_text_processor.process_text.return_value = [
            "This is the first statement.",
            "This is the second statement."
        ]
        
        response = client.post('/process-text',
            json={
                'text': 'um this is like the first statement and uh the second statement',
                'existing_blocks': []
            }
        )
        
        data = json.loads(response.data)
        assert response.status_code == 200
        assert 'blocks' in data
        assert len(data['blocks']) == 2
        assert 'processing_time_ms' in data
    
    def test_process_text_missing_text_field(self, client):
        """Test request without text field."""
        response = client.post('/process-text',
            json={'existing_blocks': []}
        )
        
        data = json.loads(response.data)
        assert response.status_code == 400
        assert 'error' in data
        assert "'text' field is required" in str(data)
    
    def test_process_text_invalid_json(self, client):
        """Test request with invalid JSON."""
        response = client.post('/process-text',
            data='invalid json',
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        assert response.status_code == 400
        assert 'error' in data
        assert 'Invalid JSON' in data['error']
    
    def test_process_text_text_too_long(self, client):
        """Test request with text exceeding max length."""
        with patch.object(Config, 'MAX_TEXT_LENGTH', 100):
            response = client.post('/process-text',
                json={
                    'text': 'x' * 101,
                    'existing_blocks': []
                }
            )
            
            data = json.loads(response.data)
            assert response.status_code == 400
            assert 'error' in data
            assert 'exceeds maximum length' in str(data)
    
    def test_process_text_too_many_blocks(self, client):
        """Test request with too many existing blocks."""
        with patch.object(Config, 'MAX_BLOCKS', 5):
            response = client.post('/process-text',
                json={
                    'text': 'new text',
                    'existing_blocks': ['block'] * 6
                }
            )
            
            data = json.loads(response.data)
            assert response.status_code == 400
            assert 'error' in data
            assert 'exceeds maximum' in str(data)
    
    def test_process_text_invalid_block_type(self, client):
        """Test request with invalid block types."""
        response = client.post('/process-text',
            json={
                'text': 'new text',
                'existing_blocks': ['valid', 123, 'another']
            }
        )
        
        data = json.loads(response.data)
        assert response.status_code == 400
        assert 'error' in data
        assert 'must be a string' in str(data)
    
    def test_process_text_with_existing_blocks(self, client, mock_text_processor):
        """Test processing with existing blocks."""
        mock_text_processor.process_text.return_value = [
            "Updated first block.",
            "Existing second block."
        ]
        
        response = client.post('/process-text',
            json={
                'text': 'update the first block',
                'existing_blocks': ['Original first block.', 'Existing second block.']
            }
        )
        
        data = json.loads(response.data)
        assert response.status_code == 200
        assert len(data['blocks']) == 2
        assert data['blocks'][0] == "Updated first block."
    
    def test_process_text_empty_text(self, client, mock_text_processor):
        """Test processing empty text."""
        mock_text_processor.process_text.return_value = ['Existing block.']
        
        response = client.post('/process-text',
            json={
                'text': '',
                'existing_blocks': ['Existing block.']
            }
        )
        
        data = json.loads(response.data)
        assert response.status_code == 200
        assert data['blocks'] == ['Existing block.']
    
    def test_process_text_exception_handling(self, client, mock_text_processor):
        """Test exception handling during processing."""
        mock_text_processor.process_text.side_effect = Exception("Processing error")
        
        response = client.post('/process-text',
            json={
                'text': 'test text',
                'existing_blocks': []
            }
        )
        
        data = json.loads(response.data)
        assert response.status_code == 500
        assert 'error' in data
        assert 'An error occurred while processing' in data['error']

class TestErrorHandlers:
    
    def test_404_error(self, client):
        """Test 404 error handler."""
        response = client.get('/nonexistent')
        data = json.loads(response.data)
        
        assert response.status_code == 404
        assert 'error' in data
        assert 'not found' in data['error'].lower()
    
    def test_method_not_allowed(self, client):
        """Test method not allowed."""
        response = client.get('/process-text')
        assert response.status_code == 405

class TestRateLimiting:
    
    @patch.object(Config, 'RATE_LIMIT_ENABLED', True)
    @patch.object(Config, 'RATE_LIMIT_CALLS', 2)
    @patch.object(Config, 'RATE_LIMIT_PERIOD', 60)
    def test_rate_limiting_exceeded(self, client_with_rate_limiting, mock_text_processor):
        """Test rate limiting when exceeded."""
        # Make successful requests up to the limit
        mock_text_processor.process_text.return_value = ["Test response"]
        
        # First two requests should succeed
        for i in range(2):
            response = client_with_rate_limiting.post('/process-text',
                json={'text': 'test', 'existing_blocks': []},
                headers={'X-Forwarded-For': '192.168.1.1'}
            )
            assert response.status_code == 200
        
        # Third request should be rate limited (429 Too Many Requests)
        response = client_with_rate_limiting.post('/process-text',
            json={'text': 'test', 'existing_blocks': []},
            headers={'X-Forwarded-For': '192.168.1.1'}
        )
        assert response.status_code == 429
        data = json.loads(response.data)
        assert 'error' in data or 'message' in data
    
    @patch.object(Config, 'RATE_LIMIT_ENABLED', False)
    def test_rate_limiting_disabled(self, client, mock_text_processor):
        """Test that rate limiting can be disabled."""
        mock_text_processor.process_text.return_value = ["Test response"]

        # Make many requests - all should succeed when rate limiting is disabled
        for i in range(10):
            response = client.post('/process-text',
                json={'text': 'test', 'existing_blocks': []}
            )
            assert response.status_code == 200

class TestFormatBlend2EndEndpoint:

    def test_format_blend2end_success(self, client, mock_text_processor):
        """Test successful blend2end formatting."""
        mock_text_processor.format_blend2end.return_value = {
            "description": "A wooden desk with two drawers",
            "functionality": ["Drawers should be grabbable and slide open"],
            "style": "Modern minimalist"
        }

        response = client.post('/format-blend2end',
            json={
                'text': 'I want a wooden desk with drawers that slide',
                'existing_form': {},
                'intent': ''
            }
        )

        data = json.loads(response.data)
        assert response.status_code == 200
        assert 'description' in data
        assert 'functionality' in data
        assert 'style' in data
        assert isinstance(data['functionality'], list)
        assert 'processing_time_ms' in data

    def test_format_blend2end_with_existing_form(self, client, mock_text_processor):
        """Test blend2end formatting with existing form data."""
        mock_text_processor.format_blend2end.return_value = {
            "description": "A wooden desk with two drawers",
            "functionality": [
                "Drawers should be grabbable and slide open",
                "Desktop should be a static surface"
            ],
            "style": "Modern minimalist"
        }

        response = client.post('/format-blend2end',
            json={
                'text': 'also the desktop should be a static surface',
                'existing_form': {
                    'description': 'A wooden desk with two drawers',
                    'functionality': ['Drawers should be grabbable and slide open'],
                    'style': 'Modern minimalist'
                }
            }
        )

        data = json.loads(response.data)
        assert response.status_code == 200
        assert len(data['functionality']) == 2

    def test_format_blend2end_missing_text(self, client):
        """Test request without text field."""
        response = client.post('/format-blend2end',
            json={'existing_form': {}}
        )

        data = json.loads(response.data)
        assert response.status_code == 400
        assert 'error' in data
        assert "'text' field is required" in str(data)

    def test_format_blend2end_invalid_json(self, client):
        """Test request with invalid JSON."""
        response = client.post('/format-blend2end',
            data='invalid json',
            content_type='application/json'
        )

        data = json.loads(response.data)
        assert response.status_code == 400
        assert 'error' in data
        assert 'Invalid JSON' in data['error']

    def test_format_blend2end_text_too_long(self, client):
        """Test request with text exceeding max length."""
        with patch.object(Config, 'MAX_TEXT_LENGTH', 100):
            response = client.post('/format-blend2end',
                json={
                    'text': 'x' * 101,
                    'existing_form': {}
                }
            )

            data = json.loads(response.data)
            assert response.status_code == 400
            assert 'error' in data
            assert 'exceeds maximum length' in str(data)

    def test_format_blend2end_invalid_existing_form_type(self, client):
        """Test request with invalid existing_form type."""
        response = client.post('/format-blend2end',
            json={
                'text': 'test text',
                'existing_form': 'not an object'
            }
        )

        data = json.loads(response.data)
        assert response.status_code == 400
        assert 'error' in data
        assert 'must be an object' in str(data)

    def test_format_blend2end_invalid_functionality_type(self, client):
        """Test request with invalid functionality type in existing_form."""
        response = client.post('/format-blend2end',
            json={
                'text': 'test text',
                'existing_form': {
                    'description': 'A desk',
                    'functionality': 'not an array',
                    'style': 'Modern'
                }
            }
        )

        data = json.loads(response.data)
        assert response.status_code == 400
        assert 'error' in data
        assert 'must be an array' in str(data)

    def test_format_blend2end_empty_text(self, client, mock_text_processor):
        """Test processing empty text with existing form."""
        mock_text_processor.format_blend2end.return_value = {
            'description': 'Existing description',
            'functionality': ['Existing functionality'],
            'style': 'Existing style'
        }

        response = client.post('/format-blend2end',
            json={
                'text': '',
                'existing_form': {
                    'description': 'Existing description',
                    'functionality': ['Existing functionality'],
                    'style': 'Existing style'
                }
            }
        )

        data = json.loads(response.data)
        assert response.status_code == 200
        assert data['description'] == 'Existing description'

    def test_format_blend2end_exception_handling(self, client, mock_text_processor):
        """Test exception handling during blend2end processing."""
        mock_text_processor.format_blend2end.side_effect = Exception("Processing error")

        response = client.post('/format-blend2end',
            json={
                'text': 'test text',
                'existing_form': {}
            }
        )

        data = json.loads(response.data)
        assert response.status_code == 500
        assert 'error' in data
        assert 'An error occurred while processing' in data['error']

    def test_format_blend2end_with_intent(self, client, mock_text_processor):
        """Test blend2end formatting with intent context."""
        mock_text_processor.format_blend2end.return_value = {
            "description": "A desk for gaming",
            "functionality": ["RGB lighting"],
            "style": "Gaming aesthetic"
        }

        response = client.post('/format-blend2end',
            json={
                'text': 'desk with RGB lights',
                'existing_form': {},
                'intent': 'Creating a gaming setup'
            }
        )

        data = json.loads(response.data)
        assert response.status_code == 200
        assert 'description' in data