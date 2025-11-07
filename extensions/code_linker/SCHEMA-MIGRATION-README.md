# Schema Migration: Complete Package

## Summary

This package contains everything needed to migrate inventory entity items from the old nested component structure to a new Firebase-optimized schema.

## Files Included

### 1. **migrate-to-new-schema.js**
Main migration script that:
- Scans all JSON files in `inventory/`
- Transforms entity structure to new schema
- Updates local files
- Syncs changes to Firebase automatically

### 2. **migrate-schema.sh**
Shell wrapper script with:
- Safety confirmation prompt
- Colored output for better UX
- Automatic dry-run detection
- Post-migration instructions

### 3. **MIGRATION-GUIDE.md**
Comprehensive documentation covering:
- Schema comparison (before/after)
- Key transformations explained
- Firebase structure changes
- Verification methods
- Troubleshooting guide
- Complete usage examples

### 4. **MIGRATION-QUICK-START.md**
Quick reference for:
- One-command testing
- One-command migration
- Quick verification
- Common issues

## Quick Start

### Test First
```bash
./migrate-schema.sh --dry-run
# or
node migrate-to-new-schema.js --dry-run
```

### Apply Migration
```bash
./migrate-schema.sh
# or (with confirmation)
node migrate-to-new-schema.js
```

## What Changes

### Before (Old Schema)
```json
{
  "data": {
    "name": "Entity",
    "components": [
      {"type": "Box", "properties": {"width": 1}}
    ],
    "children": [
      {"name": "Child", "components": [...]}
    ],
    "transform": {...}
  }
}
```

### After (New Schema)
```json
{
  "data": {
    "Entity": {
      "Entity": {
        "Child": {
          "__meta": {...}
        },
        "__meta": {
          "components": {"Box_1234": true},
          "localPosition": {...},
          "localRotation": {...},
          "localScale": {...}
        }
      }
    },
    "Components": {
      "Box_1234": {
        "type": "Box",
        "width": 1
      }
    }
  }
}
```

## Key Benefits

### 🚀 Performance
- **O(1) component lookup** - Direct access by ID
- **Shallow Firebase queries** - No deep nesting
- **Efficient updates** - Change single component without touching entity tree

### 🔧 Maintainability
- **Clear separation** - Entities describe hierarchy, Components hold data
- **Better sync** - Components sync independently
- **Scalable** - Flat structure grows better than nested

### 📊 Firebase Optimization
- **Natural paths** - `Entity/Parent/Child/__meta`
- **Efficient indexing** - Flat component lookup
- **Better queries** - Direct component access: `Components/Box_1234`

## Transformation Details

### 1. Entity Hierarchy
- Entity names become object keys
- Children nested under parent names
- Natural tree structure in JSON

### 2. Entity Metadata (`__meta`)
Each entity has a `__meta` object containing:
- `uuid` - Unique entity identifier
- `active` - Active state (boolean)
- `layer` - Render layer (number)
- `components` - Map of component IDs to `true`
- `localPosition`, `localRotation`, `localScale` - Local transform
- `position`, `rotation` - World transform (initially same as local)

### 3. Component Extraction
- All components moved to flat `Components` object
- Keyed by unique ID: `{Type}_{Number}`
- Properties flattened (no nested `properties` object)
- Type preserved in component data
- Owner extracted from `options.cmdUser` → `_owner`

### 4. Special Handling
- **MonoBehavior** - `inventoryItem` preserved
- **Transform** - No longer a component, data in `__meta`
- **Component IDs** - Auto-generated if not present

## Verification

After migration, verify:

```bash
# Check schema format
grep -r '"Entity":' inventory/ --include="*.json" | wc -l
# Should match number of entity files

grep -r '"Components":' inventory/ --include="*.json" | wc -l
# Should match number of entity files

grep -r '"children":' inventory/ --include="*.json" | grep -v history | wc -l
# Should be 0 (except in history array)

# Check Firebase sync (in Firebase Console)
# Navigate to: inventory/Technocrat/Scripts/Tracker
# Verify: data/Entity and data/Components structure
```

## Safety

The migration script includes:
1. **Dry-run mode** - Test without modifications
2. **Local-first** - Files updated before Firebase sync
3. **Git-friendly** - Easy to review changes with `git diff`
4. **Rollback support** - Simple `git checkout` to undo

## Current Status

Based on your inventory (96 JSON files):
- **96 files** will be processed
- **All entity items** will be migrated
- **Script items** will be skipped (not affected)

## Next Steps

1. ✅ Run dry-run to preview changes
2. ✅ Review transformation output
3. ✅ Apply migration
4. ✅ Verify with `git diff`
5. ✅ Check Firebase Console
6. ✅ Test loading items in-game
7. ✅ Update frontend code to work with new schema
8. ✅ Commit changes

## Migration Workflow

```
┌─────────────────┐
│  Dry Run Test   │ ← Start here
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Review Output   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Apply Migration │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Git Diff       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify Firebase │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Test In-Game   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Commit      │
└─────────────────┘
```

## Comparison with Previous Migration

### First Migration (`update-inventory-items.js`)
- Removed `spaceProps` properties
- Updated component names (BanterX → simplified)
- Converted old Transform component to entity-level
- Same nested structure

### This Migration (`migrate-to-new-schema.js`)
- Complete schema restructure
- Entities as nested objects (not arrays)
- Components as flat lookup (not nested in entities)
- Firebase-optimized paths
- Better sync performance

## Technical Notes

### Component ID Generation
IDs generated as `{Type}_{RandomNumber}`:
- Random 4-digit number (1000-9999)
- Uniqueness checked within each item
- Predictable format for debugging

### Recursive Processing
Script handles arbitrary nesting depth:
- Processes entire entity tree recursively
- Preserves all children relationships
- Maintains component references at each level

### Firebase Path Format
```
inventory/
  {Author}/
    {Folder}/
      {ItemName}/
        data/
          Entity/
            {EntityName}/
              {ChildName}/
                __meta
              __meta
          Components/
            {ComponentId}
```

## Support

For issues or questions:
1. Review `MIGRATION-GUIDE.md` for detailed docs
2. Check `MIGRATION-QUICK-START.md` for quick reference
3. Run dry-run to test without changes
4. Use git to review and rollback if needed

## Files to Read

- **Start here**: `MIGRATION-QUICK-START.md`
- **Detailed guide**: `MIGRATION-GUIDE.md`
- **Implementation**: `migrate-to-new-schema.js`
- **Helper script**: `migrate-schema.sh`
