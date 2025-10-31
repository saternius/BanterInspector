# Quick Start: Schema Migration

## What This Does

Transforms inventory entity items from nested component structure to Firebase-optimized schema:

**Old:** Components nested in entity arrays
```json
{
  "data": {
    "name": "Entity",
    "components": [{type: "Box", properties: {...}}],
    "children": [...]
  }
}
```

**New:** Entities as hierarchy, components as flat lookup
```json
{
  "data": {
    "Entity": {
      "EntityName": {
        "__meta": {components: {"Box_123": true}},
        "ChildName": {"__meta": {...}}
      }
    },
    "Components": {
      "Box_123": {...}
    }
  }
}
```

## Quick Test

```bash
# See what would change (safe, no modifications)
node migrate-to-new-schema.js --dry-run
```

## Apply Migration

```bash
# Transform all files and sync to Firebase
node migrate-to-new-schema.js
```

## What Gets Transformed

### ✅ Entity Structure
- Entity names become object keys
- Children nested under parent keys
- Metadata in `__meta` objects

### ✅ Component Storage
- Extracted to flat `Components` lookup
- Referenced by IDs in `entity.__meta.components`
- Properties flattened (no nested `properties` object)

### ✅ Transform Data
- Moved to `__meta` in each entity
- Both local and world transforms included

### ✅ Component IDs
- Generated as `Type_Number` (e.g., `Box_8933`)
- Ensures unique references

## Verification

```bash
# Check for old schema (should be 0)
grep -r '"children":' inventory/ --include="*.json" | grep -v history | wc -l

# Check for new schema (should be > 0)
grep -r '"Entity":' inventory/ --include="*.json" | wc -l
grep -r '__meta' inventory/ --include="*.json" | wc -l
```

## Rollback

```bash
# Discard all changes
git checkout -- inventory/

# Or revert commit
git revert HEAD
```

## Common Issues

### Not authenticated
- Check `config.json` credentials
- Files will update locally but not sync to Firebase

### Need to re-sync
```bash
node migrate-to-new-schema.js --force-sync
```

## More Information

See `MIGRATION-GUIDE.md` for detailed documentation.
