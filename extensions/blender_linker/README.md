# Banter GLB Uploader - Blender Add-on

A Blender add-on that enables artists to directly export selected objects as GLB files and upload them to the Banter microservice CDN.

## Features

- **Direct Export & Upload**: Export selected objects as GLB and upload to Banter CDN in one click
- **Batch Processing**: Export multiple objects individually or by collection
- **VR-Optimized Presets**: Pre-configured export settings for Mobile VR, PC VR, and High Quality
- **Validation**: Pre-export validation for polygon count, file size, and missing textures
- **Upload History**: Track recent uploads with hash IDs
- **Clipboard Integration**: Automatically copy asset hashes for easy use in Banter

## Installation

1. Download the `blender_banter_uploader` folder as a ZIP file
2. Open Blender and go to Edit → Preferences → Add-ons
3. Click "Install" and select the ZIP file
4. Enable "Import-Export: Banter GLB Uploader"

## Requirements

- Blender 3.0 or newer
- Python `requests` library (included)
- Banter file server running on port 9909 (default)

## Usage

### Basic Export & Upload

1. Select object(s) in your scene
2. Open the sidebar (N key) in 3D Viewport
3. Navigate to the "Banter" tab
4. Click "Export & Upload"
5. Choose export preset and options
6. Click OK to upload
7. Hash will be copied to clipboard automatically

### Batch Export

1. Select multiple objects
2. Click "Batch Export" in the Banter panel
3. Choose export mode:
   - **Individual Objects**: Each object as separate GLB
   - **By Collection**: Group by collection
   - **Top-Level Only**: Parent objects with children
4. Process and receive all hashes

### Export Presets

- **Mobile VR**: Optimized for Quest (1024x1024 textures, high compression)
- **PC VR**: Balanced quality (2048x2048 textures, medium compression)
- **High Quality**: Maximum quality (4096x4096 textures, no compression)
- **Custom**: Configure your own settings in preferences

## Configuration

Access preferences via Edit → Preferences → Add-ons → Banter GLB Uploader

### Server Settings
- **Server URL**: Microservice endpoint (default: https://suitable-bulldog-flying.ngrok-free.app)
- **Test Connection**: Verify server availability

### Export Settings
- **Default Preset**: Choose default export configuration
- **Custom Settings**: Configure compression, texture limits, quality

### Interface Settings
- **Auto Copy Hash**: Automatically copy hash after upload
- **Show Validation Warnings**: Display warnings before export

## Validation

The add-on validates exports before uploading:

- **Polygon Count**: Warns if exceeding VR recommendations
- **File Size**: Prevents uploads over 20MB
- **Missing Textures**: Detects and reports missing texture files
- **Modifiers**: Notifies about modifiers that will be applied

## Testing

A test script is included for verifying installation:

1. Open Blender's Text Editor
2. Load `test_addon.py`
3. Run the script to test all features
4. Check console for results

## API Endpoints

The add-on communicates with:
- `POST /api/store_glb` - Upload GLB file
- `GET /` - Check server status

## File Structure

```
blender_banter_uploader/
├── __init__.py              # Add-on registration
├── config.py                # Configuration constants
├── preferences.py           # Add-on preferences
├── operators/
│   ├── export_upload.py    # Main export operator
│   └── batch_export.py     # Batch processing
├── panels/
│   └── ui_panel.py         # UI panels
└── utils/
    ├── glb_exporter.py     # GLB export utilities
    ├── http_client.py      # Upload client
    └── validation.py       # Pre-export validation
```

## Troubleshooting

### Cannot Connect to Server
- Verify server is running on specified port
- Check firewall settings
- Test with `curl https://suitable-bulldog-flying.ngrok-free.app`

### Export Fails
- Check console for detailed error messages
- Verify all textures are available
- Try reducing texture sizes or polygon count

### Upload Timeout
- Large files may timeout - try compression
- Check network connection
- Increase timeout in preferences

## Development

To modify the add-on:

1. Edit files in `blender_banter_uploader/`
2. Reload add-on in Blender preferences
3. Test changes with included test script
4. Check Blender console for debug output

## License

Part of the Banter VR platform.