#!/usr/bin/env python3
"""
Test script for Banter GLB Uploader Blender Add-on

This script helps test the add-on functionality without actually uploading to a server.
Run this in Blender's Python console or as a script.

Usage:
1. Install the add-on in Blender
2. Open Blender's Text Editor
3. Load this script
4. Run it to test various features
"""

import bpy
import os
import sys

def test_addon_registration():
    """Test if the add-on is properly registered"""
    print("\n=== Testing Add-on Registration ===")
    
    addon_name = "blender_banter_uploader"
    
    # Check if add-on is installed
    if addon_name in bpy.context.preferences.addons:
        print(f"✓ Add-on '{addon_name}' is registered")
        addon = bpy.context.preferences.addons[addon_name]
        print(f"  Version: {addon.bl_info.get('version', 'Unknown')}")
        return True
    else:
        print(f"✗ Add-on '{addon_name}' is not registered")
        print("  Please install and enable the add-on first")
        return False


def test_operators():
    """Test if operators are registered"""
    print("\n=== Testing Operators ===")
    
    operators = [
        "banter.export_upload",
        "banter.batch_export",
        "banter.copy_hash",
        "banter.test_connection"
    ]
    
    all_registered = True
    for op_id in operators:
        if hasattr(bpy.ops.banter, op_id.split('.')[1]):
            print(f"✓ Operator '{op_id}' is registered")
        else:
            print(f"✗ Operator '{op_id}' is not registered")
            all_registered = False
    
    return all_registered


def test_panels():
    """Test if UI panels are registered"""
    print("\n=== Testing UI Panels ===")
    
    panels = [
        "BANTER_PT_upload_panel",
        "BANTER_PT_history_panel",
        "BANTER_PT_settings_panel"
    ]
    
    all_registered = True
    for panel_id in panels:
        if hasattr(bpy.types, panel_id):
            print(f"✓ Panel '{panel_id}' is registered")
        else:
            print(f"✗ Panel '{panel_id}' is not registered")
            all_registered = False
    
    return all_registered


def test_preferences():
    """Test add-on preferences"""
    print("\n=== Testing Preferences ===")
    
    addon_name = "blender_banter_uploader"
    if addon_name not in bpy.context.preferences.addons:
        print("✗ Add-on not registered, skipping preferences test")
        return False
    
    prefs = bpy.context.preferences.addons[addon_name].preferences
    
    print(f"✓ Server URL: {prefs.server_url}")
    print(f"✓ Default Preset: {prefs.default_preset}")
    print(f"✓ Auto Copy Hash: {prefs.auto_copy_hash}")
    
    return True


def create_test_objects():
    """Create test objects for export testing"""
    print("\n=== Creating Test Objects ===")
    
    # Clear existing mesh objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    
    # Create a cube
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
    cube = bpy.context.active_object
    cube.name = "TestCube"
    print(f"✓ Created test cube: {cube.name}")
    
    # Create a sphere
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(3, 0, 0))
    sphere = bpy.context.active_object
    sphere.name = "TestSphere"
    print(f"✓ Created test sphere: {sphere.name}")
    
    # Create a cylinder
    bpy.ops.mesh.primitive_cylinder_add(radius=1, depth=2, location=(-3, 0, 0))
    cylinder = bpy.context.active_object
    cylinder.name = "TestCylinder"
    print(f"✓ Created test cylinder: {cylinder.name}")
    
    # Select all test objects
    bpy.ops.object.select_all(action='SELECT')
    
    return [cube, sphere, cylinder]


def test_export_validation():
    """Test export validation without actually exporting"""
    print("\n=== Testing Export Validation ===")
    
    try:
        from blender_banter_uploader.utils import ValidationHelper, GLBExporter
        
        objects = bpy.context.selected_objects
        if not objects:
            print("✗ No objects selected for validation")
            return False
        
        # Test validation
        is_valid, warnings, errors = ValidationHelper.validate_selection(objects)
        
        if is_valid:
            print("✓ Objects passed validation")
        else:
            print("✗ Objects failed validation")
        
        if warnings:
            print("  Warnings:")
            for warning in warnings:
                print(f"    - {warning}")
        
        if errors:
            print("  Errors:")
            for error in errors:
                print(f"    - {error}")
        
        # Test poly count
        poly_count = GLBExporter.get_poly_count(objects)
        print(f"✓ Total polygon count: {poly_count:,}")
        
        # Test size estimation
        estimated_size = GLBExporter.estimate_file_size(objects)
        size_mb = estimated_size / (1024 * 1024)
        print(f"✓ Estimated file size: {size_mb:.2f}MB")
        
        return is_valid
        
    except ImportError as e:
        print(f"✗ Failed to import validation utilities: {e}")
        return False


def test_server_connection():
    """Test server connection without uploading"""
    print("\n=== Testing Server Connection ===")
    
    try:
        from blender_banter_uploader.utils import BanterUploader
        
        addon_name = "blender_banter_uploader"
        if addon_name in bpy.context.preferences.addons:
            prefs = bpy.context.preferences.addons[addon_name].preferences
            server_url = prefs.server_url
        else:
            server_url = "https://suitable-bulldog-flying.ngrok-free.app"
        
        print(f"  Testing connection to: {server_url}")
        
        if BanterUploader.check_server_status(server_url):
            print(f"✓ Server is reachable at {server_url}")
            return True
        else:
            print(f"✗ Cannot connect to server at {server_url}")
            print("  Note: This is expected if the server is not running")
            return False
            
    except ImportError as e:
        print(f"✗ Failed to import HTTP client: {e}")
        return False


def test_dry_run_export():
    """Test export to temporary file without uploading"""
    print("\n=== Testing Dry Run Export ===")
    
    try:
        from blender_banter_uploader.utils import GLBExporter
        from blender_banter_uploader import config
        
        objects = bpy.context.selected_objects
        if not objects:
            print("✗ No objects selected for export test")
            return False
        
        print(f"  Exporting {len(objects)} object(s)...")
        
        # Test export with mobile_vr preset
        settings = config.EXPORT_PRESETS['mobile_vr'].copy()
        
        filepath, glb_data = GLBExporter.export_selection(
            objects,
            settings=settings
        )
        
        size_mb = len(glb_data) / (1024 * 1024)
        print(f"✓ Successfully exported to GLB")
        print(f"  File size: {size_mb:.2f}MB")
        print(f"  Data length: {len(glb_data)} bytes")
        
        # Clean up temp file if created
        import os
        if os.path.exists(filepath):
            os.remove(filepath)
            print("✓ Cleaned up temporary file")
        
        return True
        
    except Exception as e:
        print(f"✗ Export test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all tests"""
    print("=" * 50)
    print("BANTER GLB UPLOADER - TEST SUITE")
    print("=" * 50)
    
    results = []
    
    # Test registration
    results.append(("Add-on Registration", test_addon_registration()))
    
    if results[-1][1]:  # Only continue if add-on is registered
        results.append(("Operators", test_operators()))
        results.append(("UI Panels", test_panels()))
        results.append(("Preferences", test_preferences()))
        
        # Create test objects
        create_test_objects()
        
        results.append(("Export Validation", test_export_validation()))
        results.append(("Dry Run Export", test_dry_run_export()))
        results.append(("Server Connection", test_server_connection()))
    
    # Summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
    
    return passed == total


# Run tests when script is executed
if __name__ == "__main__":
    run_all_tests()