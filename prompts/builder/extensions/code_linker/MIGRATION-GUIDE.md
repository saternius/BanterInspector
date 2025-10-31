# Migration Guide: New Firebase-Optimized Schema

## Overview

This guide explains the migration from the old nested component structure to a new Firebase-optimized schema that separates entities and components into distinct hierarchies.

## Why Migrate?

### Problems with Old Schema
```json
{
  "name": "Parent",
  "children": [
    {
      "name": "Child",
      "components": [
        {"type": "Box", "properties": {...}}
      ]
    }
  ],
  "components": [
    {"type": "Material", "properties": {...}}
  ]
}
```

**Issues:**
- Deep nesting makes Firebase queries inefficient
- Components deeply nested in entity arrays
- Difficult to update single component without loading entire tree
- Redundant data structure not optimized for Firebase Real-time Database

### New Schema Benefits
```json
{
  "Entity": {
    "Parent": {
      "Child": {
        "__meta": {
          "components": {"Box_123": true}
        }
      },
      "__meta": {
        "components": {"Material_456": true}
      }
    }
  },
  "Components": {
    "Box_123": {...},
    "Material_456": {...}
  }
}
```

**Benefits:**
- ✅ Flat component lookup by ID - O(1) access
- ✅ Entities as nested object keys - natural hierarchy
- ✅ Update single component without touching entity tree
- ✅ Firebase-optimized paths: `Entity/Parent/Child/__meta`
- ✅ Component references via IDs - efficient syncing
- ✅ Better suited for Firebase Real-time Database structure

## Schema Comparison

### Old Schema (Current)

```json
{
  "author": "Technocrat",
  "itemType": "entity",
  "data": {
    "name": "Tracker",
    "uuid": 1742740906118,
    "active": true,
    "layer": 5,
    "transform": {
      "localPosition": {"x": 0, "y": 0, "z": 0},
      "localRotation": {"x": 0, "y": 0, "z": 0, "w": 1},
      "localScale": {"x": 1, "y": 1, "z": 1}
    },
    "children": [
      {
        "name": "Holder",
        "uuid": 6001033602549,
        "active": true,
        "layer": 0,
        "transform": {...}
      }
    ],
    "components": [
      {
        "type": "Box",
        "loadAsync": false,
        "properties": {
          "width": 0.05,
          "height": 0.05,
          "depth": 0.05
        }
      },
      {
        "type": "Material",
        "properties": {
          "color": {"r": 1, "g": 1, "b": 1, "a": 1}
        }
      }
    ]
  }
}
```

### New Schema (Target)

```json
{
  "author": "Technocrat",
  "itemType": "entity",
  "data": {
    "Entity": {
      "Tracker": {
        "Holder": {
          "__meta": {
            "uuid": 6001033602549,
            "active": true,
            "layer": 0,
            "components": {},
            "localPosition": {"x": 0, "y": 0, "z": 0},
            "localRotation": {"x": 0, "y": 0, "z": 0, "w": 1},
            "localScale": {"x": 1, "y": 1, "z": 1},
            "position": {"x": 0, "y": 0, "z": 0},
            "rotation": {"x": 0, "y": 0, "z": 0, "w": 1}
          }
        },
        "__meta": {
          "uuid": 1742740906118,
          "active": true,
          "layer": 5,
          "components": {
            "Box_1234": true,
            "Material_5678": true
          },
          "localPosition": {"x": 0, "y": 0, "z": 0},
          "localRotation": {"x": 0, "y": 0, "z": 0, "w": 1},
          "localScale": {"x": 1, "y": 1, "z": 1},
          "position": {"x": 0, "y": 0, "z": 0},
          "rotation": {"x": 0, "y": 0, "z": 0, "w": 1}
        }
      }
    },
    "Components": {
      "Box_1234": {
        "type": "Box",
        "width": 0.05,
        "height": 0.05,
        "depth": 0.05
      },
      "Material_5678": {
        "type": "Material",
        "color": {"r": 1, "g": 1, "b": 1, "a": 1}
      }
    }
  }
}
```

## Key Transformations

### 1. Entity Hierarchy → Nested Objects

**Old:**
```json
{
  "name": "Parent",
  "children": [
    {"name": "Child1"},
    {"name": "Child2"}
  ]
}
```

**New:**
```json
{
  "Entity": {
    "Parent": {
      "Child1": { "__meta": {...} },
      "Child2": { "__meta": {...} },
      "__meta": {...}
    }
  }
}
```

**Note:** Entity names become object keys, creating natural hierarchy.

### 2. Components → Flat Lookup + References

**Old:**
```json
{
  "components": [
    {
      "type": "Box",
      "properties": {"width": 1, "height": 1}
    }
  ]
}
```

**New:**
```json
{
  "Entity": {
    "MyEntity": {
      "__meta": {
        "components": {
          "Box_1234": true
        }
      }
    }
  },
  "Components": {
    "Box_1234": {
      "type": "Box",
      "width": 1,
      "height": 1
    }
  }
}
```

### 3. Transform → Entity `__meta`

**Old:**
```json
{
  "transform": {
    "localPosition": {"x": 0, "y": 1, "z": 0}
  }
}
```

**New:**
```json
{
  "__meta": {
    "localPosition": {"x": 0, "y": 1, "z": 0},
    "localRotation": {"x": 0, "y": 0, "z": 0, "w": 1},
    "localScale": {"x": 1, "y": 1, "z": 1},
    "position": {"x": 0, "y": 1, "z": 0},
    "rotation": {"x": 0, "y": 0, "z": 0, "w": 1}
  }
}
```

**Note:** Both local and world transforms stored in `__meta`.

### 4. Component Properties → Flattened

**Old:**
```json
{
  "type": "Material",
  "loadAsync": false,
  "options": {"cmdUser": "Technocrat"},
  "properties": {
    "color": {"r": 1, "g": 1, "b": 1, "a": 1},
    "shaderName": "Standard"
  }
}
```

**New:**
```json
{
  "Material_5678": {
    "type": "Material",
    "_owner": "Technocrat",
    "color": {"r": 1, "g": 1, "b": 1, "a": 1},
    "shaderName": "Standard"
  }
}
```

**Note:** Properties flattened, `options.cmdUser` → `_owner`, `loadAsync` removed.

## Usage

### Test First (Dry Run)

```bash
node migrate-to-new-schema.js --dry-run
```

**Output:**
```
============================================================
Migrate to New Firebase-Optimized Schema
============================================================

🔍 DRY RUN MODE - No changes will be made

Authenticating with Firebase...
✓ Authenticated successfully
✓ Using username: Technocrat

Scanning for JSON files...
Found 96 JSON files

Processing files...
------------------------------------------------------------
Processing Scripts/Tracker.json... ✓ would be migrated
Processing PanelSpawner/SpawnPanel.json... ✓ would be migrated
Processing Clock/Clock6.json... ○ Already in new schema
...

============================================================
Summary
============================================================
Total files:      96
Processed:        92 (would be migrated)
Skipped:          4
Errors:           0

To apply these changes, run without --dry-run flag
```

### Apply Migration

```bash
node migrate-to-new-schema.js
```

This will:
1. Transform all entity items to new schema
2. Update local JSON files
3. Sync changes to Firebase automatically

### Force Re-sync

If you need to re-sync files already in new schema:

```bash
node migrate-to-new-schema.js --force-sync
```

## Firebase Structure

### Before Migration
```
inventory/
  Technocrat/
    Scripts/
      Tracker/
        data/
          name: "Tracker"
          components: [...]
          children: [...]
```

### After Migration
```
inventory/
  Technocrat/
    Scripts/
      Tracker/
        data/
          Entity/
            Tracker/
              __meta: {...}
              Holder/
                __meta: {...}
          Components/
            Box_1234: {...}
            Material_5678: {...}
```

## Component ID Generation

Component IDs are generated as `{Type}_{RandomNumber}`:

- `Box_8933`
- `Material_5933`
- `MonoBehavior_263`
- `MeshCollider_6711`

If a component already has an `id` field, it will be preserved.

## Safety & Rollback

### Check Changes
```bash
# See what files changed
git status

# See detailed changes
git diff inventory/

# Review specific file
git diff inventory/Technocrat/Scripts/Tracker.json
```

### Commit (if satisfied)
```bash
git add inventory/
git commit -m "Migrate inventory to new Firebase-optimized schema"
```

### Rollback (if needed)
```bash
# Discard all changes
git checkout -- inventory/

# Or revert the commit
git revert HEAD
```

## Expected Changes Per File

For each entity item, you should see:

1. ✅ `data.name` removed (now object key)
2. ✅ `data.children` array → nested objects
3. ✅ `data.components` array → `__meta.components` map
4. ✅ New `data.Entity` root with entity name as key
5. ✅ New `data.Components` flat lookup
6. ✅ Transform properties in each `__meta`
7. ✅ Component properties flattened
8. ✅ Component IDs generated

## Verification

### Check Schema Format
```bash
# Look for old schema patterns
grep -r '"children":' inventory/Technocrat --include="*.json" | wc -l
# Should be 0 (except in history)

# Look for new schema patterns
grep -r '"Entity":' inventory/Technocrat --include="*.json" | wc -l
# Should match number of entity files

grep -r '"Components":' inventory/Technocrat --include="*.json" | wc -l
# Should match number of entity files

grep -r '__meta' inventory/Technocrat --include="*.json" | wc -l
# Should be > 0
```

### Verify Firebase Sync
1. Open Firebase Console
2. Navigate to Realtime Database
3. Check `inventory/Technocrat/Scripts/Tracker`
4. Verify structure matches new schema

## Troubleshooting

### "Not authenticated"
**Issue:** Cannot sync to Firebase
**Solution:** Check `config.json` has correct `username` and `secret`

### "Auth server not available"
**Issue:** Custom claims registration fails
**Solution:** Ensure auth server is running at the URL in `config.json`

### Files migrated but Firebase sync failed
**Solution:**
1. Fix authentication
2. Re-run with `--force-sync` flag
3. Or manually trigger sync via linker service

### Component ID conflicts
**Issue:** Duplicate component IDs generated
**Solution:** Script uses random IDs - extremely rare, but re-run if it occurs

## Next Steps

After successful migration:

1. ✅ Update frontend code to work with new schema
2. ✅ Update linker.js if needed
3. ✅ Test loading items in-game
4. ✅ Verify component references work correctly
5. ✅ Update any tools/scripts that read inventory items

## Support

If you encounter issues:
1. Check the dry-run output first
2. Review git diff to understand changes
3. Check Firebase Console to verify sync
4. Roll back if needed using git checkout

## Technical Details

### Component ID Set
The script maintains a Set of component IDs to ensure uniqueness across all entities in a single item.

### Recursive Processing
The migration handles deeply nested entity hierarchies recursively, preserving the full tree structure.

### Special Component Fields
- `inventoryItem` - Preserved for MonoBehavior components
- `_owner` - Extracted from `options.cmdUser`
- `type` - Added to component data for reference

### Transform Properties
Both local and world transform properties are stored in `__meta`:
- `localPosition`, `localRotation`, `localScale` (from old transform)
- `position`, `rotation` (world space, initially same as local)
