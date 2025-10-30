# Inventory Items Update Script

This script processes all entity JSON files in the inventory and applies the same transformations as the inventory UI's `updateItems()` method, then syncs changes to Firebase.

## What It Does

The script performs three transformations on entity items:

1. **Convert Old Format to New Format**
   - Removes `Transform` from components array
   - Moves transform data to entity-level `transform` property
   - Removes deprecated `options` wrapper from components

2. **Update Component Names**
   - Converts BanterX component names to simplified format
   - Example: `BanterBox` → `Box`, `BanterMaterial` → `Material`

3. **Remove Space Props**
   - Recursively removes `spaceProps` property from all entities
   - Cleans up entity data to match current schema

## Prerequisites

1. Ensure you have `config.json` configured with:
   - `username`: Your username
   - `secret`: Your secret key
   - `inventory_dirs`: Array of inventory directories to watch
   - `auth_server_url`: Auth server URL

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

## Usage

### Dry Run (Recommended First)

Test what changes would be made without actually modifying files:

```bash
node update-inventory-items.js --dry-run
```

or

```bash
node update-inventory-items.js -d
```

This will:
- Scan all JSON files in the inventory
- Report which files would be updated
- List what transformations would be applied
- **NOT** write any changes to files or Firebase

### Apply Changes

Once you've reviewed the dry run output and are ready to apply changes:

```bash
node update-inventory-items.js
```

This will:
- Process all entity JSON files
- Apply necessary transformations
- Write updated files back to disk
- Sync changes to Firebase (if authenticated)

## Output

The script provides detailed output:

```
============================================================
Inventory Items Update Script
============================================================

Authenticating with Firebase...
✓ Authenticated successfully with UID: abc123...
✓ Using username: YourUsername
✓ Custom claims registered for: YourUsername

Scanning for JSON files...
Found 245 JSON files

Processing files...
------------------------------------------------------------
Processing Technocrat/Clock/Clock6.json... ✓ converted old format, removed spaceProps
  → Synced to: inventory/Technocrat/Clock/Clock6.json
Processing Technocrat/Scripts/controller.js... ○ Not an entity item
Processing Technocrat/Tables/Table1.json... ○ Already up to date
...

============================================================
Summary
============================================================
Total files:        245
Processed:          89 (updated)
Skipped:            154
Errors:             2
Synced to Firebase: 89
```

## What Gets Updated

- **Entity items only** (itemType: 'entity')
- Only files that need updates (have old format, BanterX names, or spaceProps)
- All changes are applied recursively through the entire entity tree (including children)

## What Gets Skipped

- Non-entity items (scripts, markdown files)
- Entity items already in the correct format
- Files that fail to parse

## Error Handling

If errors occur:
- The script continues processing other files
- Errors are reported in the summary
- Check the output for specific error messages

## Firebase Sync

If authenticated with Firebase:
- Each updated file is synced to Firebase automatically
- Firebase path matches the inventory folder structure
- Path components are sanitized for Firebase compliance

If not authenticated:
- Files are still updated locally
- No Firebase sync occurs
- A warning is shown in the output

## Important Notes

1. **Backup recommended**: While the script creates properly formatted JSON, it's good practice to backup your inventory before running
2. **Large inventories**: Processing may take a while for large inventories (the script processes files sequentially)
3. **File watching**: The main linker service watches for Firebase changes - this script pushes local → Firebase
4. **Git tracking**: Updated files will show as modified in git - review changes before committing

## Example Workflow

```bash
# 1. See what would change
node update-inventory-items.js --dry-run

# 2. Review the output

# 3. Apply changes if everything looks good
node update-inventory-items.js

# 4. Review changed files
git status
git diff inventory/

# 5. Commit if satisfied
git add inventory/
git commit -m "Update inventory items to new schema"
```

## Troubleshooting

### Authentication Issues
```
✗ Authentication failed: ...
⚠ Running in read-only mode - writes will fail
```
**Solution**: Check your `config.json` credentials

### Auth Server Not Available
```
⚠ Auth server not available - running without custom claims
```
**Solution**: Ensure the auth server is running, or continue without custom claims (may have permission issues)

### Firebase Sync Failures
If files update but Firebase sync fails, you can:
1. Check your Firebase authentication
2. Manually sync using the main linker service
3. Re-run the script after fixing auth issues

## Related Files

- `linker.js` - Main linker service (watches Firebase → local)
- `config.json` - Configuration file
- `inventory/` - Inventory directory with all items
- `../../frontend/js/pages/inventory/inventory.js` - Source of transformation logic
