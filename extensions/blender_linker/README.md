# Tippy Blender Link - Blender Add-on

A Blender add-on that enables artists to directly export selected objects as GLB files and upload them to Firebase Storage and Realtime Database for use in virtual spaces.

## Features

- **Direct Export & Upload**: Export selected objects as GLB and upload to Firebase Storage
- **Automatic Entity Creation**: Creates components and entities in Firebase Realtime Database
- **Batch Processing**: Export multiple objects individually or by collection
- **VR-Optimized Presets**: Pre-configured export settings for Mobile VR, PC VR, and High Quality
- **Transform Preservation**: Maintains position, rotation, and scale data in Firebase
- **Validation**: Pre-export validation for polygon count, file size, and missing textures
- **Upload History**: Track recent uploads with storage URLs
- **Clipboard Integration**: Automatically copy asset URLs for easy reference

## Installation

1. Download the `blender_banter_uploader` folder as a ZIP file
2. Open Blender and go to Edit → Preferences → Add-ons
3. Click "Install" and select the ZIP file
4. Enable "Import-Export: Tippy Blender Link"

## Requirements

- Blender 3.0 or newer
- Python `requests` library (included)
- Firebase project with:
  - Storage bucket configured
  - Realtime Database enabled
  - API key and configuration

## Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. Enable Firebase Storage
4. Enable Realtime Database

### 2. Get Configuration
1. Go to Project Settings → General
2. Under "Your apps", create a Web app if you haven't already
3. Copy the Firebase configuration object:
   ```javascript
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "...",
     databaseURL: "..."
   };
   ```

### 3. Configure Security Rules (Optional)
For Firebase Storage:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /glbs/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

For Realtime Database:
```json
{
  "rules": {
    "space": {
      "$spaceId": {
        ".read": true,
        ".write": "auth != null"
      }
    }
  }
}
```

### 4. Configure in Blender
1. Open Blender Preferences → Add-ons → Tippy Blender Link
2. Enter all Firebase configuration values
3. Set your Space ID (e.g., "ccfaa6")
4. Click "Test Firebase Connection" to verify

## Usage

### Basic Export & Upload

1. Select object(s) in your scene
2. Open the sidebar (N key) in 3D Viewport
3. Navigate to the "Tippy" tab
4. Click "Export & Upload"
5. Choose export preset and options
6. Click OK to upload
7. Storage URL will be copied to clipboard automatically

### Batch Export

1. Select multiple objects
2. Click "Batch Export" in the Tippy panel
3. Choose export mode:
   - **Individual Objects**: Each object as separate GLB
   - **By Collection**: Group by collection
   - **Top-Level Only**: Parent objects with children
4. Process and receive all URLs

### Export Presets

- **Mobile VR**: Optimized for Quest (1024x1024 textures, high compression)
- **PC VR**: Balanced quality (2048x2048 textures, medium compression)
- **High Quality**: Maximum quality (4096x4096 textures, no compression)
- **Custom**: Configure your own settings in preferences

## Configuration

Access preferences via Edit → Preferences → Add-ons → Tippy Blender Link

### Firebase Configuration
- **API Key**: Your Firebase API key
- **Auth Domain**: Firebase auth domain (e.g., your-project.firebaseapp.com)
- **Project ID**: Your Firebase project ID
- **Storage Bucket**: Firebase storage bucket (e.g., your-project.appspot.com)
- **Messaging Sender ID**: Firebase messaging sender ID
- **App ID**: Your Firebase app ID
- **Database URL**: Firebase Realtime Database URL
- **Space ID**: Target space identifier for entity creation
- **Test Connection**: Verify Firebase connectivity

### Export Settings
- **Default Preset**: Choose default export configuration
- **Custom Settings**: Configure compression, texture limits, quality

### Interface Settings
- **Auto Copy URL**: Automatically copy storage URL after upload
- **Show Validation Warnings**: Display warnings before export

## Validation

The add-on validates exports before uploading:

- **Polygon Count**: Warns if exceeding VR recommendations
- **File Size**: Prevents uploads over 40MB
- **Missing Textures**: Detects and reports missing texture files
- **Modifiers**: Notifies about modifiers that will be applied

## Testing

A test script is included for verifying installation:

1. Open Blender's Text Editor
2. Load `test_addon.py`
3. Run the script to test all features
4. Check console for results

## Firebase Operations

The add-on performs the following Firebase operations:
- **Storage Upload**: Uploads GLB files to Firebase Storage at `glbs/{hash}.glb`
- **Component Creation**: Creates component definitions at `space/{spaceId}/components/{componentId}`
- **Entity Creation**: Creates entity entries at `space/{spaceId}/Scene/{meshName}`
- **Connection Test**: Verifies Firebase configuration and connectivity

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
    ├── firebase_client.py  # Firebase integration
    ├── http_client.py      # Legacy upload client
    └── validation.py       # Pre-export validation
```

## Troubleshooting

### Cannot Connect to Firebase
- Verify Firebase configuration is complete
- Check API key is valid
- Ensure Storage and Realtime Database are enabled in Firebase Console
- Test connection using the "Test Firebase Connection" button in preferences

### Export Fails
- Check console for detailed error messages
- Verify all textures are available
- Try reducing texture sizes or polygon count

### Upload Fails
- Verify Space ID is set in preferences
- Check Firebase Storage rules allow writes
- Ensure file size is under 40MB limit
- Check network connection
- Increase timeout in preferences

## Development

To modify the add-on:

1. Edit files in `blender_banter_uploader/`
2. Reload add-on in Blender preferences
3. Test changes with included test script
4. Check Blender console for debug output

## License

Part of the Tippy VR platform.