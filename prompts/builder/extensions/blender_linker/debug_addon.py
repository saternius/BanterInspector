#!/usr/bin/env python3
"""
Debug script for Banter GLB Uploader Blender Add-on
Run this in Blender's Python console to diagnose registration issues.
"""

import bpy
import sys
import traceback
import importlib

def diagnose_addon():
    """Comprehensive diagnostic of the addon registration issue"""
    print("\n" + "="*60)
    print("BANTER GLB UPLOADER - DIAGNOSTIC REPORT")
    print("="*60)
    
    # System info
    print("\n[SYSTEM INFO]")
    print(f"Blender Version: {bpy.app.version_string}")
    print(f"Blender Version Tuple: {bpy.app.version}")
    print(f"Python Version: {sys.version}")
    print(f"Python Path: {sys.executable}")
    
    # Check if addon exists
    addon_name = "blender_banter_uploader"
    print(f"\n[ADDON STATUS]")
    print(f"Looking for addon: {addon_name}")
    
    # Check if registered
    if addon_name in bpy.context.preferences.addons:
        print(f"✓ Addon is registered")
        addon = bpy.context.preferences.addons[addon_name]
        print(f"  Addon object: {addon}")
    else:
        print(f"✗ Addon is NOT registered")
    
    # Try to import the addon module
    print(f"\n[MODULE IMPORT TEST]")
    try:
        if addon_name in sys.modules:
            print(f"✓ Module already in sys.modules")
            addon_module = sys.modules[addon_name]
        else:
            print(f"  Attempting to import {addon_name}...")
            addon_module = importlib.import_module(addon_name)
            print(f"✓ Module imported successfully")
        
        print(f"  Module path: {addon_module.__file__}")
        print(f"  Module package: {addon_module.__package__}")
        
    except Exception as e:
        print(f"✗ Failed to import module: {e}")
        print(traceback.format_exc())
        return
    
    # Test preferences module specifically
    print(f"\n[PREFERENCES MODULE TEST]")
    try:
        # Import preferences module
        prefs_module = importlib.import_module(f"{addon_name}.preferences")
        print(f"✓ Preferences module imported")
        print(f"  Module: {prefs_module}")
        
        # Check for the class
        if hasattr(prefs_module, 'BanterUploaderPreferences'):
            print(f"✓ BanterUploaderPreferences class found")
            pref_class = prefs_module.BanterUploaderPreferences
            print(f"  Class: {pref_class}")
            print(f"  bl_idname: {pref_class.bl_idname}")
            
            # Check properties
            print(f"\n  Checking properties:")
            for attr_name in dir(pref_class):
                if not attr_name.startswith('_'):
                    attr = getattr(pref_class, attr_name, None)
                    if hasattr(attr, '__class__'):
                        if 'Property' in attr.__class__.__name__:
                            print(f"    - {attr_name}: {attr.__class__.__name__}")
        else:
            print(f"✗ BanterUploaderPreferences class not found")
            
    except Exception as e:
        print(f"✗ Error with preferences module: {e}")
        print(traceback.format_exc())
    
    # Test manual registration
    print(f"\n[MANUAL REGISTRATION TEST]")
    try:
        # First unregister if already registered
        if addon_name in bpy.context.preferences.addons:
            print("  Unregistering existing addon...")
            bpy.ops.preferences.addon_disable(module=addon_name)
        
        # Try to register manually
        print("  Attempting manual registration...")
        
        # Import the addon
        if addon_name in sys.modules:
            # Reload if already imported
            importlib.reload(sys.modules[addon_name])
        else:
            importlib.import_module(addon_name)
        
        # Call register function
        if hasattr(sys.modules[addon_name], 'register'):
            sys.modules[addon_name].register()
            print("✓ Manual registration succeeded")
        else:
            print("✗ No register function found")
            
    except Exception as e:
        print(f"✗ Manual registration failed: {e}")
        print(f"  Error type: {type(e).__name__}")
        print(traceback.format_exc())
    
    # Check for specific StringProperty issue
    print(f"\n[STRINGPROPERTY TEST]")
    try:
        from bpy.props import StringProperty
        
        # Test creating a simple StringProperty
        test_prop = StringProperty(
            name="Test",
            description="Test property",
            default="test"
        )
        print(f"✓ Basic StringProperty creation works")
        
        # Test with URL subtype
        try:
            test_url_prop = StringProperty(
                name="Test URL",
                description="Test URL property",
                default="https://example.com",
                subtype='URL'
            )
            print(f"✓ StringProperty with URL subtype works")
        except Exception as e:
            print(f"✗ StringProperty with URL subtype failed: {e}")
            
    except Exception as e:
        print(f"✗ StringProperty test failed: {e}")
    
    # Check registered classes
    print(f"\n[REGISTERED CLASSES]")
    registered_classes = []
    
    # Check for operators
    if hasattr(bpy.ops, 'banter'):
        print("✓ banter operators namespace exists")
        for op in dir(bpy.ops.banter):
            if not op.startswith('_'):
                registered_classes.append(f"banter.{op}")
                print(f"  - banter.{op}")
    else:
        print("✗ No banter operators registered")
    
    # Check for panels
    panel_classes = ['BANTER_PT_upload_panel', 'BANTER_PT_history_panel', 'BANTER_PT_settings_panel']
    for panel_name in panel_classes:
        if hasattr(bpy.types, panel_name):
            registered_classes.append(panel_name)
            print(f"  ✓ {panel_name} registered")
        else:
            print(f"  ✗ {panel_name} NOT registered")
    
    print(f"\n[SUMMARY]")
    print(f"Total registered classes: {len(registered_classes)}")
    
    print("\n" + "="*60)
    print("END OF DIAGNOSTIC REPORT")
    print("="*60)

# Alternative test: Try creating preferences class from scratch
def test_minimal_preferences():
    """Test creating a minimal preferences class"""
    print("\n[MINIMAL PREFERENCES TEST]")
    
    try:
        from bpy.types import AddonPreferences
        from bpy.props import StringProperty
        
        class TestPreferences(AddonPreferences):
            bl_idname = "test_addon"
            
            test_url: StringProperty(
                name="Test URL",
                description="Test URL property",
                default="https://example.com"
            )
        
        # Try to register
        bpy.utils.register_class(TestPreferences)
        print("✓ Minimal preferences class registered successfully")
        
        # Unregister
        bpy.utils.unregister_class(TestPreferences)
        print("✓ Successfully unregistered test class")
        
    except Exception as e:
        print(f"✗ Minimal preferences test failed: {e}")
        print(traceback.format_exc())

# Run diagnostics
if __name__ == "__main__":
    diagnose_addon()
    test_minimal_preferences()