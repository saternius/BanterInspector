# Claude Sync Automation

## Overview
This automation solution ensures that when Claude edits files in the `prompts/builder/extensions/code_linker/inventory/` directory, they are automatically synced to the game using the existing `update_on_save.py` mechanism.

## Components

### 1. `claude_sync.py`
Main synchronization script that wraps the existing `update_on_save.py` functionality.

**Features:**
- Sync individual files or multiple files
- Sync recently modified files (default: last 5 minutes)
- Batch sync all inventory files
- Provides clear success/failure feedback

**Usage:**
```bash
# Sync a specific file
python3 prompts/builder/extensions/code_linker/claude_sync.py path/to/file.js

# Sync multiple files
python3 prompts/builder/extensions/code_linker/claude_sync.py file1.js file2.json

# Sync files modified in last 5 minutes
python3 prompts/builder/extensions/code_linker/claude_sync.py --recent

# Sync files modified in last 10 minutes
python3 prompts/builder/extensions/code_linker/claude_sync.py --recent 10

# Sync ALL inventory files (use with caution)
python3 prompts/builder/extensions/code_linker/claude_sync.py --all
```

### 2. `.claude/hooks/post-edit.sh`
Optional hook script that can be called after Claude edits a file.

**Usage:**
```bash
.claude/hooks/post-edit.sh path/to/edited/file.js
```

This hook automatically checks if the file is in the inventory directory and syncs it if it is.

### 3. `sync-inventory` (Convenience Command)
Quick command located in the inspector root directory for easy manual syncing.

**Usage:**
```bash
# From inspector directory:

# Sync recent files (last 5 minutes) - DEFAULT
./sync-inventory

# Pass any claude_sync.py arguments
./sync-inventory --recent 10
./sync-inventory specific-file.js
```

## How Claude Uses This

When I (Claude) edit files in the inventory directory, I will:

1. **After each file edit**, automatically run:
   ```bash
   python3 /path/to/claude_sync.py [edited_file]
   ```

2. **After batch edits**, run:
   ```bash
   python3 /path/to/claude_sync.py --recent
   ```

3. **Example workflow:**
   ```python
   # Claude edits a file
   Edit("inventory/Technocrat/Scripts/MyScript.js", ...)

   # Claude immediately syncs it
   Bash("python3 prompts/builder/extensions/code_linker/claude_sync.py inventory/Technocrat/Scripts/MyScript.js")
   ```

## Manual Usage

If you need to manually sync files after your own edits:

1. **Quick sync recent changes:**
   ```bash
   ./sync-inventory
   ```

2. **Sync specific file after editing:**
   ```bash
   python3 prompts/builder/extensions/code_linker/claude_sync.py inventory/Technocrat/Scripts/MyScript.js
   ```

3. **Sync all files modified in last 10 minutes:**
   ```bash
   ./sync-inventory --recent 10
   ```

## Integration with Existing VSCode Setup

This automation works alongside your existing VSCode TriggerTaskOnSave extension:
- **VSCode saves (Ctrl+S)**: Trigger via TriggerTaskOnSave extension
- **Claude edits**: Trigger via claude_sync.py
- **Both use**: The same underlying `update_on_save.py` script

## Troubleshooting

1. **Files not syncing**: Check that the linker service is running on port 5005
2. **Permission errors**: Ensure scripts are executable (`chmod +x`)
3. **Path errors**: All paths are relative to the inspector root directory

## Notes
- The sync process sends HTTP requests to `localhost:5005/save?file=<path>`
- Only `.js` and `.json` files in the inventory directory are synced
- Small delays (0.1s) are added between batch syncs to avoid overwhelming the server