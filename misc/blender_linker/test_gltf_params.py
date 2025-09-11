#!/usr/bin/env python3
"""
Test script to identify available GLTF export parameters in your Blender version
Run this in Blender's Text Editor to see what parameters are supported
"""

import bpy

def test_gltf_export_params():
    """Test which GLTF export parameters work in current Blender version"""
    
    print("\n" + "="*60)
    print("GLTF EXPORT PARAMETER TEST")
    print("="*60)
    print(f"Blender Version: {bpy.app.version_string}")
    print(f"Blender Version Tuple: {bpy.app.version}")
    
    # Create a test cube if none exists
    if not bpy.context.selected_objects:
        bpy.ops.mesh.primitive_cube_add()
    
    # Test parameters one by one
    test_params = [
        ('use_selection', True),
        ('export_selected', True),  # Old parameter name
        ('use_visible', False),
        ('export_apply', True),
        ('export_texcoords', True),
        ('export_normals', True),
        ('export_materials', 'EXPORT'),
        ('export_colors', True),
        ('export_vertex_colors', True),  # Alternative name
        ('export_animations', True),
        ('export_cameras', False),
        ('export_lights', False),
        ('export_draco_mesh_compression_enable', True),
        ('export_draco_mesh_compression_level', 6),
        ('export_image_format', 'AUTO'),
        ('export_image_quality', 75),
    ]
    
    working_params = {}
    failed_params = []
    
    import tempfile
    import os
    
    # Create temp file
    temp_fd, temp_path = tempfile.mkstemp(suffix='.glb')
    os.close(temp_fd)
    
    print("\nTesting parameters:")
    print("-" * 40)
    
    for param_name, param_value in test_params:
        try:
            # Test with single parameter
            test_dict = {
                'filepath': temp_path,
                'export_format': 'GLB',
                param_name: param_value
            }
            
            # Try the export
            bpy.ops.export_scene.gltf(**test_dict)
            working_params[param_name] = param_value
            print(f"✓ {param_name}: WORKS")
            
        except TypeError as e:
            failed_params.append(param_name)
            print(f"✗ {param_name}: FAILED - {str(e)[:50]}")
    
    # Clean up temp file
    try:
        os.remove(temp_path)
    except:
        pass
    
    # Try a combined export with all working params
    print("\n" + "-" * 40)
    print("Testing combined parameters...")
    
    combined_params = {
        'filepath': temp_path,
        'export_format': 'GLB',
    }
    combined_params.update(working_params)
    
    try:
        bpy.ops.export_scene.gltf(**combined_params)
        print("✓ Combined export with all working parameters: SUCCESS")
    except Exception as e:
        print(f"✗ Combined export failed: {e}")
    
    # Clean up
    try:
        os.remove(temp_path)
    except:
        pass
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Working parameters: {len(working_params)}")
    print(f"Failed parameters: {len(failed_params)}")
    
    print("\nRecommended minimal export call for your version:")
    print("-" * 40)
    print("bpy.ops.export_scene.gltf(")
    print("    filepath='path/to/file.glb',")
    print("    export_format='GLB',")
    if 'use_selection' in working_params:
        print("    use_selection=True,")
    elif 'export_selected' in working_params:
        print("    export_selected=True,")
    print(")")
    
    print("\n" + "="*60)
    
    return working_params

# Also try to introspect the operator
def introspect_gltf_operator():
    """Try to get all available parameters through introspection"""
    
    print("\n" + "="*60)
    print("GLTF OPERATOR INTROSPECTION")
    print("="*60)
    
    try:
        # Get the operator function
        op_func = bpy.ops.export_scene.gltf
        
        # Try to access the operator's poll function to get its class
        if hasattr(op_func, '_op'):
            op_class = op_func._op
            print(f"Operator class: {op_class}")
            
            # Try to get properties
            if hasattr(op_class, 'bl_rna'):
                rna = op_class.bl_rna
                print("\nProperties from bl_rna:")
                for prop in rna.properties:
                    if prop.identifier != 'rna_type':
                        print(f"  - {prop.identifier}")
        
        # Alternative method: try to get from the actual export
        import io
        from contextlib import redirect_stdout
        
        # Capture help output
        f = io.StringIO()
        with redirect_stdout(f):
            try:
                help(bpy.ops.export_scene.gltf)
            except:
                pass
        
        help_text = f.getvalue()
        if help_text:
            print("\nFrom help() output:")
            # Parse parameters from help text
            lines = help_text.split('\n')
            for line in lines:
                if '=' in line and not line.strip().startswith('#'):
                    param = line.split('=')[0].strip()
                    if param and not param.startswith('('):
                        print(f"  - {param}")
                        
    except Exception as e:
        print(f"Introspection failed: {e}")
    
    print("="*60)

if __name__ == "__main__":
    working_params = test_gltf_export_params()
    introspect_gltf_operator()