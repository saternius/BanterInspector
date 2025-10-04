# Statement Block Service API

Base URL: `http://localhost:5000` (development)

## Endpoints

### GET /health

Health check endpoint to verify service status.

**Response:**
```json
{
  "status": "healthy",
  "service": "statement-block-service",
  "version": "1.0.0",
  "model_provider": "gemini",
  "redis": "connected"
}
```

---

### POST /process-text

Processes unstructured text into organized statement blocks. Cleans up speech artifacts, fixes grammar, and intelligently merges with existing blocks.

**Request:**
```json
{
  "text": "string (required) - the new text to process",
  "existing_blocks": ["array (optional) - existing statement blocks"],
  "intent": "string (optional) - context or intent of the text"
}
```

**Response:**
```json
{
  "blocks": ["array of processed statement blocks"],
  "processing_time_ms": 1234
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/process-text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "So I was using the app and like the menu is really hard to find you know and also the colors are too bright",
    "existing_blocks": [],
    "intent": "User feedback about UI"
  }'
```

**Example Response:**
```json
{
  "blocks": [
    "The menu is difficult to find in the app.",
    "The color scheme is too bright and causes eye strain."
  ],
  "processing_time_ms": 1543
}
```

---

### POST /format-blend2end

Converts unstructured dialogue into structured 3D object specifications for the Blend2End system. Extracts description, functionality requirements, and style information.

**Request:**
```json
{
  "text": "string (required) - the new text to process",
  "existing_form": {
    "description": "string (optional) - existing object description",
    "functionality": ["array (optional) - existing functionality requirements"],
    "style": "string (optional) - existing style description"
  },
  "intent": "string (optional) - context or intent of the text"
}
```

**Response:**
```json
{
  "description": "A clear description of the 3D object",
  "functionality": [
    "Array of specific functional requirements",
    "Each describing a behavior or interaction"
  ],
  "style": "The aesthetic or design style",
  "processing_time_ms": 1234
}
```

**Example 1 - Initial specification:**
```bash
curl -X POST http://localhost:5000/format-blend2end \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I want a wooden desk with two drawers that slide open",
    "existing_form": {},
    "intent": ""
  }'
```

**Example Response:**
```json
{
  "description": "A wooden desk with two drawers",
  "functionality": [
    "Drawers should be grabbable and slide open"
  ],
  "style": "Modern minimalist",
  "processing_time_ms": 1876
}
```

**Example 2 - Adding to existing specification:**
```bash
curl -X POST http://localhost:5000/format-blend2end \
  -H "Content-Type: application/json" \
  -d '{
    "text": "also the desktop should be a static surface for placing objects",
    "existing_form": {
      "description": "A wooden desk with two drawers",
      "functionality": ["Drawers should be grabbable and slide open"],
      "style": "Modern minimalist"
    },
    "intent": ""
  }'
```

**Example Response:**
```json
{
  "description": "A wooden desk with two drawers",
  "functionality": [
    "Drawers should be grabbable and slide open",
    "Desktop should be a static surface for placing objects"
  ],
  "style": "Modern minimalist",
  "processing_time_ms": 1654
}
```

**Example 3 - Updating style:**
```bash
curl -X POST http://localhost:5000/format-blend2end \
  -H "Content-Type: application/json" \
  -d '{
    "text": "make it look Victorian style",
    "existing_form": {
      "description": "A wooden desk with two drawers",
      "functionality": ["Drawers should be grabbable and slide open"],
      "style": "Modern minimalist"
    }
  }'
```

**Example Response:**
```json
{
  "description": "A wooden desk with two drawers",
  "functionality": [
    "Drawers should be grabbable and slide open"
  ],
  "style": "Victorian",
  "processing_time_ms": 1432
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "status_code": 400,
  "details": "Additional details (only in debug mode)"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation errors, invalid JSON)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `504` - Gateway Timeout (request exceeded 30 seconds)

---

## Rate Limiting

Default: 100 requests per hour per IP address

When rate limit is exceeded, you'll receive a 429 status code.

---

## Notes

- Maximum text length: 10,000 characters
- Maximum blocks: 50
- Request timeout: 30 seconds
- Empty text with existing data returns the existing data unchanged
- The service supports both Claude and Gemini models (configurable via environment variables)
