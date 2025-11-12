bl_info = {
    "name": "Tippy Blender Link",
    "author": "Tippy Team",
    "version": (2, 0, 0),
    "blender": (3, 0, 0),
    "location": "View3D > Sidebar > Tippy",
    "description": "Export and upload GLB files to Firebase Storage and Realtime Database",
    "warning": "",
    "doc_url": "",
    "category": "Import-Export",
}

import bpy
import sys
import traceback

# Debug mode flag
DEBUG = True

def debug_print(msg):
    """Print debug messages"""
    if DEBUG:
        print(f"[TIPPY DEBUG] {msg}")

def register():
    debug_print("="*50)
    debug_print("Starting Tippy Blender Link registration...")
    debug_print(f"Python version: {sys.version}")
    debug_print(f"Blender version: {bpy.app.version_string}")
    debug_print(f"Module name: {__name__}")
    debug_print(f"Package: {__package__}")
    
    try:
        debug_print("Importing modules...")
        from . import preferences
        debug_print(f"  Preferences module: {preferences}")
        
        from . import scene_properties
        debug_print(f"  Scene properties module: {scene_properties}")
        
        from . import operators
        debug_print(f"  Operators module: {operators}")
        
        from . import panels
        debug_print(f"  Panels module: {panels}")
        
        from . import config
        debug_print(f"  Config module: {config}")
        debug_print(f"  Firebase config template loaded")
        
    except Exception as e:
        debug_print(f"ERROR during imports: {e}")
        debug_print(traceback.format_exc())
        raise
    
    try:
        debug_print("Registering scene properties...")
        scene_properties.register()
        debug_print("  ✓ Scene properties registered")
    except Exception as e:
        debug_print(f"ERROR registering scene properties: {e}")
        debug_print(traceback.format_exc())
        raise
    
    try:
        debug_print("Registering preferences...")
        preferences.register()
        debug_print("  ✓ Preferences registered")
    except Exception as e:
        debug_print(f"ERROR registering preferences: {e}")
        debug_print(traceback.format_exc())
        raise
    
    try:
        debug_print("Registering operators...")
        operators.register()
        debug_print("  ✓ Operators registered")
    except Exception as e:
        debug_print(f"ERROR registering operators: {e}")
        debug_print(traceback.format_exc())
        raise
    
    try:
        debug_print("Registering panels...")
        panels.register()
        debug_print("  ✓ Panels registered")
    except Exception as e:
        debug_print(f"ERROR registering panels: {e}")
        debug_print(traceback.format_exc())
        raise
    
    debug_print("✓ Tippy Blender Link registered successfully!")
    debug_print("="*50)

def unregister():
    debug_print("="*50)
    debug_print("Unregistering Tippy Blender Link...")
    
    try:
        from . import panels, operators, preferences, scene_properties
        
        panels.unregister()
        debug_print("  ✓ Panels unregistered")
        
        operators.unregister()
        debug_print("  ✓ Operators unregistered")
        
        preferences.unregister()
        debug_print("  ✓ Preferences unregistered")
        
        scene_properties.unregister()
        debug_print("  ✓ Scene properties unregistered")
        
    except Exception as e:
        debug_print(f"ERROR during unregister: {e}")
        debug_print(traceback.format_exc())
    
    debug_print("✓ Tippy Blender Link unregistered")
    debug_print("="*50)

if __name__ == "__main__":
    register()