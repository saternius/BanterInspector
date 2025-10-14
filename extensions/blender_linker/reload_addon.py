"""
Blender script to reload the Banter GLB Uploader addon during development.
Run this in Blender's Text Editor to quickly reload your changes.

Usage:
1. Make changes to addon code
2. Run this script in Blender (Alt+P in Text Editor)
3. Changes are immediately available
"""

import bpy
import sys
import importlib
from pathlib import Path

def reload_addon():
    """Reload the Banter GLB Uploader addon and all its modules"""
    
    addon_name = "blender_banter_uploader"
    
    print("\n" + "="*50)
    print("Reloading Banter GLB Uploader...")
    print("="*50)
    
    # First, disable the addon if it's enabled
    if addon_name in bpy.context.preferences.addons:
        bpy.ops.preferences.addon_disable(module=addon_name)
        print(f"✓ Disabled {addon_name}")
    
    # Remove all addon modules from sys.modules to force reload
    modules_to_remove = []
    for module_name in sys.modules:
        if module_name.startswith(addon_name):
            modules_to_remove.append(module_name)
    
    for module_name in modules_to_remove:
        del sys.modules[module_name]
        print(f"✓ Removed module: {module_name}")
    
    # Re-enable the addon
    try:
        bpy.ops.preferences.addon_enable(module=addon_name)
        print(f"✓ Re-enabled {addon_name}")
        print("\n✅ Addon reloaded successfully!")
        
        # Show addon version to confirm reload
        if addon_name in bpy.context.preferences.addons:
            addon = bpy.context.preferences.addons[addon_name]
            if hasattr(addon, 'bl_info'):
                version = addon.bl_info.get('version', 'Unknown')
                print(f"   Version: {version}")
        
    except Exception as e:
        print(f"\n❌ Failed to reload addon: {e}")
        print("\nTry manually enabling the addon in Preferences > Add-ons")
    
    print("="*50 + "\n")

# Alternative method using importlib (more thorough)
def deep_reload_addon():
    """Deep reload of addon and all submodules"""
    
    addon_name = "blender_banter_uploader"
    
    print("\n" + "="*50)
    print("Deep Reloading Banter GLB Uploader...")
    print("="*50)
    
    # Disable addon
    if addon_name in bpy.context.preferences.addons:
        bpy.ops.preferences.addon_disable(module=addon_name)
    
    # Get the addon module
    if addon_name in sys.modules:
        addon_module = sys.modules[addon_name]
        
        # Reload all submodules
        submodules = [
            'config',
            'preferences',
            'operators',
            'operators.export_upload',
            'operators.batch_export',
            'panels',
            'panels.ui_panel',
            'utils',
            'utils.glb_exporter',
            'utils.http_client',
            'utils.validation',
        ]
        
        for submodule_name in submodules:
            full_name = f"{addon_name}.{submodule_name}"
            if full_name in sys.modules:
                importlib.reload(sys.modules[full_name])
                print(f"✓ Reloaded: {submodule_name}")
        
        # Reload main module
        importlib.reload(addon_module)
        print(f"✓ Reloaded main module")
    
    # Re-enable addon
    bpy.ops.preferences.addon_enable(module=addon_name)
    print("\n✅ Deep reload complete!")
    print("="*50 + "\n")

# Quick reload function (for operator)
class BANTER_OT_reload_addon(bpy.types.Operator):
    """Reload the Banter GLB Uploader addon"""
    bl_idname = "banter.reload_addon"
    bl_label = "Reload Banter Addon"
    
    def execute(self, context):
        reload_addon()
        self.report({'INFO'}, "Banter addon reloaded")
        return {'FINISHED'}

# Register the reload operator
def register():
    bpy.utils.register_class(BANTER_OT_reload_addon)

def unregister():
    bpy.utils.unregister_class(BANTER_OT_reload_addon)

# Run the reload immediately when this script is executed
if __name__ == "__main__":
    # Register the operator first
    try:
        register()
        print("✓ Registered reload operator: banter.reload_addon")
        print("  You can now use F3 > 'Reload Banter Addon' for quick reloads")
    except:
        pass
    
    # Perform the reload
    reload_addon()
    
    # Optional: Add a UI button for quick reload
    def draw_reload_button(self, context):
        self.layout.operator("banter.reload_addon", text="Reload Addon", icon='FILE_REFRESH')
    
    # Add to an existing panel if available
    if hasattr(bpy.types, 'BANTER_PT_settings_panel'):
        bpy.types.BANTER_PT_settings_panel.prepend(draw_reload_button)