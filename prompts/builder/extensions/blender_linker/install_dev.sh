#!/bin/bash

# Development installation script for Banter GLB Uploader
# Creates a symlink from Blender's add-ons directory to your development folder

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ADDON_DIR="$SCRIPT_DIR/blender_banter_uploader"

# Common Blender addon paths - modify based on your OS and Blender version
# Linux default paths
BLENDER_PATHS=(
    "$HOME/.config/blender/4.2/scripts/addons"
    "$HOME/.config/blender/4.1/scripts/addons"
    "$HOME/.config/blender/4.0/scripts/addons"
    "$HOME/.config/blender/3.6/scripts/addons"
    "$HOME/.config/blender/3.5/scripts/addons"
    "$HOME/.config/blender/3.4/scripts/addons"
    "$HOME/.config/blender/3.3/scripts/addons"
    "$HOME/.config/blender/3.2/scripts/addons"
    "$HOME/.config/blender/3.1/scripts/addons"
    "$HOME/.config/blender/3.0/scripts/addons"
)

echo "Banter GLB Uploader - Development Installation"
echo "=============================================="
echo ""
echo "This script will create a symbolic link from your Blender add-ons"
echo "directory to the development folder, allowing live code updates."
echo ""
echo "Addon source: $ADDON_DIR"
echo ""

# Find existing Blender installations
FOUND_PATH=""
for PATH in "${BLENDER_PATHS[@]}"; do
    if [ -d "$(dirname "$PATH")" ]; then
        echo "Found Blender config: $PATH"
        FOUND_PATH="$PATH"
        break
    fi
done

if [ -z "$FOUND_PATH" ]; then
    echo "No Blender installation found in standard locations."
    echo "Please enter your Blender addons path manually:"
    echo "(e.g., /home/user/.config/blender/4.0/scripts/addons)"
    read -r CUSTOM_PATH
    FOUND_PATH="$CUSTOM_PATH"
fi

# Create addons directory if it doesn't exist
mkdir -p "$FOUND_PATH"

# Remove existing installation if present
LINK_PATH="$FOUND_PATH/blender_banter_uploader"
if [ -e "$LINK_PATH" ]; then
    echo "Removing existing installation at $LINK_PATH"
    rm -rf "$LINK_PATH"
fi

# Create symbolic link
echo "Creating symbolic link..."
ln -s "$ADDON_DIR" "$LINK_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Development link created."
    echo ""
    echo "Next steps:"
    echo "1. Open Blender"
    echo "2. Go to Edit > Preferences > Add-ons"
    echo "3. Search for 'Banter'"
    echo "4. Enable 'Banter GLB Uploader'"
    echo ""
    echo "You can now edit files in $ADDON_DIR"
    echo "and reload the addon in Blender with F3 > 'Reload Scripts'"
    echo "or by disabling and re-enabling the addon."
else
    echo ""
    echo "❌ Failed to create symbolic link."
    echo "You may need to run this script with sudo."
fi