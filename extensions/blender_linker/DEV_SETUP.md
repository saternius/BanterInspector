# Development Setup for Tippy Blender Link

This guide explains how to set up a development environment for the Blender add-on without constantly zipping and reinstalling.

## Method 1: Symbolic Link (Recommended)

This method creates a symbolic link from Blender's add-ons directory to your development folder, allowing immediate updates when you save files.

### Linux/Mac Setup

1. Run the install script:
```bash
cd /path/to/blender_linker
./install_dev.sh
```

2. The script will:
   - Find your Blender installation
   - Create a symlink to the development folder
   - Enable live code updates

### Windows Setup

1. **Run as Administrator** (required for symlinks):
   - Right-click `install_dev.bat`
   - Select "Run as administrator"

2. The script will create a symlink to your development folder

### Manual Symlink Creation

If the scripts don't work, create the symlink manually:

**Linux/Mac:**
```bash
# Find your Blender addons folder (usually one of these):
# ~/.config/blender/4.0/scripts/addons
# ~/Library/Application Support/Blender/4.0/scripts/addons

# Create symlink
ln -s /path/to/blender_linker/blender_banter_uploader ~/.config/blender/4.0/scripts/addons/blender_banter_uploader
```

**Windows (Admin CMD):**
```cmd
mklink /D "%APPDATA%\Blender Foundation\Blender\4.0\scripts\addons\blender_banter_uploader" "C:\path\to\blender_linker\blender_banter_uploader"
```

## Method 2: Direct Installation to Scripts Folder

Copy (don't move) the addon folder directly to Blender's scripts directory, then use your IDE to edit those files:

```bash
# Linux/Mac
cp -r blender_banter_uploader ~/.config/blender/4.0/scripts/addons/

# Windows
xcopy /E /I blender_banter_uploader "%APPDATA%\Blender Foundation\Blender\4.0\scripts\addons\blender_banter_uploader"
```

## Method 3: Add to Python Path

Add your development directory to Blender's Python path at startup:

1. Create a startup file: `~/.config/blender/4.0/scripts/startup/dev_path.py`

2. Add this code:
```python
import sys
import os
sys.path.insert(0, '/path/to/blender_linker')
```

## Reloading Changes

After making code changes, you need to reload the add-on. There are several ways:

### Option 1: Quick Reload Script (Fastest)

1. Open `reload_addon.py` in Blender's Text Editor
2. Run it with Alt+P whenever you make changes
3. The script also adds a reload operator you can access with F3

### Option 2: F3 Reload Scripts

1. Press F3 in Blender
2. Search for "Reload Scripts"
3. This reloads all Python scripts (slower but thorough)

### Option 3: Toggle Add-on

1. Go to Edit → Preferences → Add-ons
2. Find "Tippy Blender Link"
3. Disable and re-enable it

### Option 4: Restart Blender

Most thorough but slowest - completely restarts Blender

## Development Workflow

### Recommended Setup

1. **Install via symlink** using the provided script
2. **Open your IDE** in the `blender_linker` directory
3. **Keep Blender open** with the reload script loaded
4. **Make changes** in your IDE
5. **Press Alt+P** in Blender's Text Editor to reload
6. **Test immediately** without restarting Blender

### VSCode Integration

For VSCode users, create `.vscode/settings.json`:

```json
{
    "python.analysis.extraPaths": [
        "/path/to/blender/4.0/python/lib/python3.10/site-packages"
    ],
    "python.autoComplete.extraPaths": [
        "/path/to/blender/4.0/python/lib/python3.10/site-packages"
    ]
}
```

This enables Blender API autocomplete in VSCode.

### Debugging

1. **Enable Developer Extras** in Blender Preferences → Interface
2. **Use Python Console** for interactive debugging:
   ```python
   import blender_banter_uploader
   dir(blender_banter_uploader)
   ```
3. **Check System Console** (Window → Toggle System Console on Windows)
4. **Add print statements** - they appear in the console

## Tips

- **Version Control**: The symlink method works great with git
- **Multiple Blender Versions**: Create symlinks for each version you test with
- **Hot Reload**: Some changes (like new operators) may require a full reload
- **Cache Issues**: If changes don't appear, check `sys.modules` and clear cached modules

## Troubleshooting

### Symlink Not Working

- **Linux/Mac**: Check permissions on the source folder
- **Windows**: Must run as Administrator to create symlinks
- **Alternative**: Use junction points on Windows: `mklink /J` instead of `/D`

### Changes Not Reflecting

1. Make sure you're editing the right files (check the symlink target)
2. Some changes require full reload (new files, registration changes)
3. Clear Python cache: `import sys; sys.modules.clear()`

### Import Errors

- Ensure all `__init__.py` files are present
- Check relative imports are correct
- Verify the addon name matches the folder name

## Quick Commands Reference

```bash
# Check where addon is loaded from (in Blender Python Console)
import blender_banter_uploader
print(blender_banter_uploader.__file__)

# Force reload all modules
import importlib
import sys
for module in list(sys.modules.keys()):
    if module.startswith('blender_banter_uploader'):
        importlib.reload(sys.modules[module])

# Check if addon is enabled
import bpy
'blender_banter_uploader' in bpy.context.preferences.addons
```

With this setup, you can develop efficiently without the constant zip/install cycle!