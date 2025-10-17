# Blender to Banter GLB Uploader Extension Blueprint

## Overview
A Blender add-on that enables artists to directly export selected objects as GLB files and upload them to the Banter microservice CDN. This streamlines the workflow from Blender to the Banter VR platform.

## Core Features

### 1. Object Export & Upload
- Export selected object(s) as GLB format
- Automatic upload to microservice at `https://suitable-bulldog-flying.ngrok-free.app/api/store_glb`
- Return hash identifier for uploaded asset
- Copy hash to clipboard for easy reference

### 2. Batch Processing
- Support multi-object selection
- Option to export as single combined GLB or separate files
- Progress indicator for large uploads

### 3. Export Configuration
- Configurable export settings (compression, textures, animations)
- Material optimization options
- Automatic texture size limits for VR performance
- Option to apply modifiers before export

## Technical Architecture

### File Structure
```
blender_banter_uploader/
├── __init__.py              # Add-on registration and metadata
├── operators/
│   ├── __init__.py
│   ├── export_upload.py    # Main export and upload operator
│   └── batch_export.py     # Batch processing operator
├── panels/
│   ├── __init__.py
│   └── ui_panel.py         # UI panel in 3D viewport sidebar
├── utils/
│   ├── __init__.py
│   ├── glb_exporter.py     # GLB export utilities
│   ├── http_client.py      # HTTP upload handling
│   └── validation.py       # Pre-export validation
├── preferences.py           # Add-on preferences (server URL, defaults)
└── config.py               # Configuration constants
```

### Implementation Components

#### 1. GLB Export Module (`utils/glb_exporter.py`)
```python
class GLBExporter:
    def export_selection(objects, filepath, settings):
        # Uses bpy.ops.export_scene.gltf()
        # Handle temporary file creation
        # Apply export settings
        # Return filepath or bytes
```

#### 2. HTTP Upload Module (`utils/http_client.py`)
```python
class BanterUploader:
    def upload_glb(glb_data, server_url):
        # POST to /api/store_glb
        # Handle response and errors
        # Return hash from server
        # Progress callback support
```

#### 3. Main Operator (`operators/export_upload.py`)
```python
class BANTER_OT_export_upload(bpy.types.Operator):
    bl_idname = "banter.export_upload"
    bl_label = "Export & Upload to Banter"
    
    def execute(self, context):
        # Validate selection
        # Export to temporary GLB
        # Upload to server
        # Report result to user
        # Copy hash to clipboard
```

#### 4. UI Panel (`panels/ui_panel.py`)
```python
class BANTER_PT_upload_panel(bpy.types.Panel):
    bl_label = "Banter GLB Uploader"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "Banter"
    
    def draw(self, context):
        # Server status indicator
        # Export settings
        # Upload button
        # Recent uploads list
        # Hash display/copy field
```

## User Workflow

1. **Selection**: Artist selects object(s) in Blender
2. **Configuration**: Opens Banter panel in sidebar (N-panel)
3. **Settings**: Adjusts export settings if needed
4. **Export**: Clicks "Export & Upload to Banter"
5. **Progress**: Views upload progress
6. **Result**: Receives hash ID, automatically copied to clipboard
7. **Integration**: Uses hash in Banter inspector/inventory

## Export Settings

### Default Configuration
```python
export_settings = {
    'export_format': 'GLB',
    'export_image_format': 'AUTO',  # JPEG for diffuse, PNG for others
    'export_texture_dir': '',
    'export_texcoords': True,
    'export_normals': True,
    'export_materials': 'EXPORT',
    'export_colors': True,
    'export_cameras': False,
    'export_lights': False,
    'export_animations': True,
    'export_frame_range': False,
    'export_apply': True,  # Apply modifiers
    'export_compression': 9,  # Draco compression
    'export_image_quality': 75,
}
```

### VR-Optimized Presets
- **Mobile VR**: Aggressive compression, texture limits (1024x1024)
- **PC VR**: Balanced quality/performance (2048x2048 textures)
- **High Quality**: Minimal compression for hero assets

## Error Handling

### Pre-Export Validation
- Check object has mesh data
- Verify no missing textures
- Warn about high poly count (>100k for mobile VR)
- Check file size estimate (<20MB limit)

### Upload Errors
- Network connection failures
- Server unavailable (offer retry)
- File size exceeded (suggest optimization)
- Invalid response format

## Advanced Features

### 1. History Management
- Store recent uploads with metadata
- Quick re-upload of previous exports
- Hash lookup and management

### 2. Collection Export
- Export entire collections as single GLB
- Maintain hierarchy structure
- Instance optimization

### 3. Material Optimization
- Automatic PBR material conversion
- Texture atlas generation option
- Shader-to-GLB material mapping

### 4. Animation Support
- Action export selection
- NLA track support
- Animation optimization settings

## Installation & Setup

### Requirements
- Blender 3.0+
- Python requests library (bundled)
- Local Banter file server running on port 9909

### Installation Steps
1. Download add-on as ZIP
2. Install via Blender Preferences > Add-ons
3. Enable "Banter GLB Uploader"
4. Configure server URL in preferences

## Development Roadmap

### Phase 1: MVP (Week 1)
- Basic export and upload functionality
- Simple UI panel
- Hash display and clipboard copy

### Phase 2: Enhanced UX (Week 2)
- Progress indicators
- Export presets
- Error handling and retry logic

### Phase 3: Advanced Features (Week 3-4)
- Batch processing
- History management
- Material optimization
- Collection support

### Phase 4: Integration (Week 5)
- Direct inventory integration
- Asset preview in Blender
- Two-way sync capabilities

## Testing Strategy

### Unit Tests
- Export function with various object types
- HTTP client with mock server
- Settings validation

### Integration Tests
- Full export-upload pipeline
- Error recovery scenarios
- Large file handling

### User Testing
- Workflow efficiency measurement
- Error message clarity
- Performance with complex scenes

## Performance Considerations

### Memory Management
- Stream large files instead of loading to memory
- Cleanup temporary files after upload
- Efficient texture processing

### Optimization
- Parallel texture processing
- Incremental upload for large files
- Caching of export settings

## Security Considerations

- Validate server URL format
- HTTPS support for production
- Optional authentication token support
- Sanitize file paths and names

## Documentation Requirements

- Quick start guide
- Video tutorial for artists
- Troubleshooting guide
- API reference for developers

## Success Metrics

- Upload success rate >95%
- Average time from selection to hash <30 seconds
- File size reduction average >40%
- User adoption rate in art pipeline

## Dependencies

### Python Packages
- `requests` - HTTP client (bundled)
- `hashlib` - File hashing (built-in)
- `tempfile` - Temporary file management (built-in)

### Blender APIs
- `bpy.ops.export_scene.gltf()` - GLB export
- `bpy.types.Operator` - Custom operators
- `bpy.types.Panel` - UI panels
- `bpy.context` - Scene context access

## Configuration File Example

```python
# config.py
DEFAULT_SERVER_URL = "https://suitable-bulldog-flying.ngrok-free.app"
MAX_FILE_SIZE_MB = 20
TEMP_DIR = None  # Use system temp
DEFAULT_EXPORT_PRESET = "mobile_vr"

EXPORT_PRESETS = {
    "mobile_vr": {...},
    "pc_vr": {...},
    "high_quality": {...}
}
```

## Next Steps

1. Create initial add-on structure
2. Implement basic export operator
3. Add HTTP upload functionality
4. Create UI panel
5. Test with sample models
6. Iterate based on artist feedback