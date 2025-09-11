bl_info = {
    "name": "Banter GLB Uploader",
    "author": "Banter Team",
    "version": (1, 0, 0),
    "blender": (3, 0, 0),
    "location": "View3D > Sidebar > Banter",
    "description": "Export and upload GLB files to Banter microservice CDN",
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
        print(f"[BANTER DEBUG] {msg}")

def register():
    debug_print("="*50)
    debug_print("Starting Banter GLB Uploader registration...")
    debug_print(f"Python version: {sys.version}")
    debug_print(f"Blender version: {bpy.app.version_string}")
    debug_print(f"Module name: {__name__}")
    debug_print(f"Package: {__package__}")
    
    try:
        debug_print("Importing preferences module...")
        from . import preferences
        debug_print(f"  Preferences module: {preferences}")
        
        debug_print("Importing operators module...")
        from . import operators
        debug_print(f"  Operators module: {operators}")
        
        debug_print("Importing panels module...")
        from . import panels
        debug_print(f"  Panels module: {panels}")
        
        debug_print("Importing config module...")
        from . import config
        debug_print(f"  Config module: {config}")
        debug_print(f"  Default server URL: {config.DEFAULT_SERVER_URL}")
        
    except Exception as e:
        debug_print(f"ERROR during imports: {e}")
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
    
    debug_print("✓ Banter GLB Uploader registered successfully!")
    debug_print("="*50)

def unregister():
    debug_print("="*50)
    debug_print("Unregistering Banter GLB Uploader...")
    
    try:
        from . import panels, operators, preferences
        
        panels.unregister()
        debug_print("  ✓ Panels unregistered")
        
        operators.unregister()
        debug_print("  ✓ Operators unregistered")
        
        preferences.unregister()
        debug_print("  ✓ Preferences unregistered")
        
    except Exception as e:
        debug_print(f"ERROR during unregister: {e}")
        debug_print(traceback.format_exc())
    
    debug_print("✓ Banter GLB Uploader unregistered")
    debug_print("="*50)

if __name__ == "__main__":
    register()