# Linker Service - Firebase Inventory Sync

The linker service synchronizes your local inventory files with Firebase Realtime Database using authentication.

## Features

- **Authenticated Firebase Access**: Uses anonymous authentication with your configured username/secret
- **Bidirectional Sync**: 
  - Downloads inventory items from Firebase to local files
  - Uploads local file changes back to Firebase
- **Multi-format Support**: Handles scripts (.js), markdown (.md), and entities (.json)
- **Real-time Updates**: Listens for Firebase changes and updates local files immediately

## Setup

1. **Install Dependencies**:
```bash
npm install firebase
```

2. **Configure Authentication**:
Copy `config.example.json` to `config.json` and update with your credentials:

```json
{
  "username": "your_username",
  "secret": "your_secret_from_localstorage",
  "uid": "optional_uid_for_scene_sync",
  "inventory_dirs": ["scripts", "entities", "markdown"]
}
```

- **username**: Your Banter username (used for inventory path)
- **secret**: The secret from localStorage in the inspector (same as `networking.secret`)
- **uid**: Optional UID for scene sync
- **inventory_dirs**: Folders to sync within your inventory

3. **Run the Service**:
```bash
node linker.js
```

## How It Works

### Authentication Flow
1. Service starts and reads config.json
2. Authenticates anonymously with Firebase
3. Uses your username to determine inventory paths
4. Syncs inventory at path: `inventory/{username}/{folder}/`

### File Sync
- **From Firebase → Local**: Automatically downloads new/updated items
- **From Local → Firebase**: Use the HTTP endpoint to save changes

### Save Endpoint
To save a local file to Firebase:
```
GET http://localhost:5005/save?file=./inventory/scripts/myScript.js
```

The service will:
1. Check authentication status
2. Read the file content
3. Build the correct Firebase path using your username
4. Save to Firebase with proper metadata

## File Structure

Local files are organized as:
```
./inventory/
  ├── scripts/
  │   └── myScript.js
  ├── entities/
  │   └── myEntity.json
  └── markdown/
      └── notes.md
```

Firebase structure:
```
inventory/
  └── {username}/
      ├── scripts/
      │   └── myScript (with itemType, data, author, etc.)
      ├── entities/
      │   └── myEntity (JSON object)
      └── markdown/
          └── notes (with itemType, data, author, etc.)
```

## Metadata

Each inventory item includes:
- `author`: Your username
- `name`: File name without extension
- `created`: Timestamp when created
- `last_used`: Timestamp when last accessed
- `data`: The actual content
- `itemType`: Type of item (script/markdown/entity)

## Security

- Uses Firebase anonymous authentication
- Secret is stored in config.json (keep this file secure!)
- Write operations require successful authentication
- Read operations work even without auth (for public folders)

## Troubleshooting

### "Not authenticated" Error
- Check that `username` and `secret` are set in config.json
- Ensure anonymous authentication is enabled in Firebase Console
- Verify the secret matches what's in localStorage

### Files Not Syncing
- Check Firebase rules allow access to your inventory path
- Verify the username is correctly sanitized (no special characters)
- Check console logs for specific error messages

### Permission Denied
- Firebase rules might be blocking access
- Ensure you're using the correct username that matches the rules
- Check if anonymous authentication is enabled in Firebase

## Development

To extend the linker:
1. Add new item types in the file type detection
2. Extend the metadata structure as needed
3. Add new endpoints for additional operations

The service is designed to be extensible for future inventory management needs.