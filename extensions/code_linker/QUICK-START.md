# Quick Start: Update Inventory Items

## What This Does

Processes all entity JSON files in your inventory and:
1. ✅ Removes `Transform` from components (moves to entity-level)
2. ✅ Updates component names (BanterX → simplified format)
3. ✅ Removes `spaceProps` from all entities
4. ✅ Syncs changes to Firebase automatically

## Test First (Recommended)

```bash
# See what would change without modifying anything
./update-items.sh --dry-run
```

OR

```bash
node update-inventory-items.js --dry-run
```

### What You'll See

```
============================================================
Inventory Items Update Script
============================================================

🔍 DRY RUN MODE - No changes will be made

Authenticating with Firebase...
✓ Authenticated successfully
✓ Using username: Technocrat

Scanning for JSON files...
Found 96 JSON files

Processing files...
------------------------------------------------------------
Processing Clock/Clock6.json... ✓ converted old format, updated component names
Processing Scripts/controller.json... ✓ converted old format, updated component names
Processing Chess/ChessPawn.json... ○ Already up to date
...

============================================================
Summary
============================================================
Total files:      96
Processed:        92 (would be updated)
Skipped:          4
Errors:           0

To apply these changes, run without --dry-run flag
```

## Apply Changes

Once you've reviewed the dry run:

```bash
./update-items.sh
```

This will:
1. Ask for confirmation
2. Update all files
3. Sync to Firebase
4. Show summary

## Direct Usage (No Confirmation)

```bash
node update-inventory-items.js
```

## What Gets Updated

### Files That Will Be Processed
- ✅ All `.json` files with `itemType: 'entity'`
- ✅ Files in any subdirectory of `inventory/`
- ✅ Only files that need updates

### Files That Will Be Skipped
- ⏭️ Non-entity items (scripts, markdown)
- ⏭️ Files already in correct format
- ⏭️ Invalid/unparseable JSON files

## Current Status (Your Inventory)

Based on your dry run results:
- **96 JSON files** found
- **92 files** need updating
- **4 files** already up to date
- **0 errors**

### Common Updates Needed
Most files need:
- `converted old format` - Transform removal + schema update
- `updated component names` - BanterX → simplified names
- `removed spaceProps` - Clean up entity properties

## Safety Features

1. **Dry run first** - Always test before applying
2. **Confirmation prompt** - When using the shell script
3. **Detailed logging** - See exactly what changes
4. **Error handling** - Continues on errors, reports at end
5. **Firebase sync** - Only if authenticated

## After Running

### Check Changes
```bash
# See what files changed
git status

# See detailed changes
git diff inventory/

# Review specific file
git diff inventory/Technocrat/Clock/Clock6.json
```

### Commit (if satisfied)
```bash
git add inventory/
git commit -m "Update inventory items: remove spaceProps, convert to new format"
```

## Rollback (if needed)

```bash
# Discard all changes
git checkout -- inventory/

# Or revert the commit
git revert HEAD
```

## Troubleshooting

### "Not authenticated"
**Issue**: Cannot sync to Firebase
**Solution**: Check `config.json` has correct `username` and `secret`

### "Auth server not available"
**Issue**: Custom claims registration fails
**Solution**: Ensure auth server is running at the URL in `config.json`

### Files updated but Firebase sync failed
**Solution**:
1. Fix authentication
2. Re-run the script (it will skip unchanged files)
3. Or manually trigger sync via linker service

## More Information

See `UPDATE-ITEMS-README.md` for detailed documentation.
