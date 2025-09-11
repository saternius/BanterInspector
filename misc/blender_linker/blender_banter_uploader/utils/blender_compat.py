"""
Blender version compatibility helper
Handles differences in GLTF exporter parameters across Blender versions
"""

import bpy

def get_gltf_export_params(settings, filepath):
    """
    Get GLTF export parameters compatible with current Blender version.
    
    Args:
        settings: Export settings dict from config
        filepath: Output file path
        
    Returns:
        dict: Parameters compatible with current Blender version
    """
    blender_version = bpy.app.version
    
    # Base parameters that work across versions
    params = {
        'filepath': filepath,
        'export_format': settings.get('export_format', 'GLB'),
    }
    
    # Version-specific parameter mapping
    if blender_version >= (4, 0, 0):
        # Blender 4.0+ parameters
        params.update({
            'use_selection': True,
            'use_visible': False,
            'use_renderable': False,
            'export_apply': settings.get('export_apply', True),
            'export_texcoords': settings.get('export_texcoords', True),
            'export_normals': settings.get('export_normals', True),
            'export_materials': settings.get('export_materials', 'EXPORT'),
            'use_mesh_edges': False,
            'use_mesh_vertices': False,
            'export_cameras': settings.get('export_cameras', False),
            'export_lights': settings.get('export_lights', False),
            'export_animations': settings.get('export_animations', True),
            'export_frame_range': settings.get('export_frame_range', False),
            'export_frame_step': 1,
            'export_force_sampling': False,
            'export_animation_mode': 'ACTIONS',
            'export_nla_strips_merged_animation_name': 'Animation',
            'optimize_animation_size': True,
            'export_anim_slide_to_zero': False,
            'export_bake_animation': False,
            'export_anim_single_armature': True,
            'export_reset_pose_bones': True,
            'export_current_frame': False,
            'export_rest_position_armature': True,
            'export_anim_scene_split_object': True,
            'export_def_bones': False,
            'export_hierarchy_flatten_bones': False,
            'export_optimize_animation_keep_anim_armature': True,
            'export_optimize_animation_keep_anim_object': False,
            'export_negative_frame': 'CLIP',
            'export_skins': True,
            'export_influence_nb': 4,
            'export_all_influences': False,
            'export_morph': True,
            'export_morph_normal': True,
            'export_morph_tangent': False,
            'export_morph_animation': True,
            'export_morph_reset_sk_data': True,
            'export_attributes': False,
            'use_mesh_edges': False,
            'use_mesh_vertices': False,
            'export_shared_accessors': False,
            'export_try_sparse_sk': True,
            'export_try_omit_sparse_sk': False,
            'export_gpu_instances': False,
            'export_action_filter': False,
            'export_convert_animation_pointer': False,
            'export_user_extensions': False,
        })
        
        # Add vertex colors parameter (different in 4.0+)
        if hasattr(bpy.ops.export_scene.gltf, 'export_colors'):
            params['export_colors'] = settings.get('export_colors', True)
        else:
            params['export_vertex_colors'] = settings.get('export_colors', True)
            
    elif blender_version >= (3, 3, 0):
        # Blender 3.3+ parameters
        params.update({
            'use_selection': True,
            'use_visible': False,
            'use_renderable': False,
            'export_apply': settings.get('export_apply', True),
            'export_texcoords': settings.get('export_texcoords', True),
            'export_normals': settings.get('export_normals', True),
            'export_materials': settings.get('export_materials', 'EXPORT'),
            'export_colors': settings.get('export_colors', True),
            'export_attributes': False,
            'use_mesh_edges': False,
            'use_mesh_vertices': False,
            'export_cameras': settings.get('export_cameras', False),
            'export_lights': settings.get('export_lights', False),
            'export_animations': settings.get('export_animations', True),
            'export_frame_range': settings.get('export_frame_range', False),
            'export_frame_step': 1,
            'export_force_sampling': False,
            'export_animation_mode': 'ACTIONS',
            'export_nla_strips_merged_animation_name': 'Animation',
            'optimize_animation_size': True,
            'export_anim_slide_to_zero': False,
            'export_bake_animation': False,
            'export_anim_single_armature': True,
            'export_reset_pose_bones': True,
            'export_current_frame': False,
            'export_rest_position_armature': True,
            'export_anim_scene_split_object': True,
            'export_def_bones': False,
            'export_hierarchy_flatten_bones': False,
            'export_optimize_animation_keep_anim_armature': True,
            'export_optimize_animation_keep_anim_object': False,
            'export_negative_frame': 'CLIP',
            'export_skins': True,
            'export_influence_nb': 4,
            'export_all_influences': False,
            'export_morph': True,
            'export_morph_normal': True,
            'export_morph_tangent': False,
            'export_morph_animation': True,
            'export_morph_reset_sk_data': True,
            'export_shared_accessors': False,
            'export_try_sparse_sk': True,
            'export_try_omit_sparse_sk': False,
            'export_gpu_instances': False,
            'export_action_filter': False,
            'export_convert_animation_pointer': False,
            'export_user_extensions': False,
        })
        
    else:
        # Blender 3.0 - 3.2 parameters (more limited)
        params.update({
            'use_selection': True,
            'use_visible': False,
            'use_renderable': False,
            'export_apply': settings.get('export_apply', True),
            'export_texcoords': settings.get('export_texcoords', True),
            'export_normals': settings.get('export_normals', True),
            'export_materials': settings.get('export_materials', 'EXPORT'),
            'export_colors': settings.get('export_colors', True),
            'export_cameras': settings.get('export_cameras', False),
            'export_lights': settings.get('export_lights', False),
            'export_animations': settings.get('export_animations', True),
            'export_frame_range': settings.get('export_frame_range', False),
            'export_frame_step': 1,
            'export_force_sampling': False,
            'export_nla_strips': False,
            'export_def_bones': False,
            'export_current_frame': False,
            'export_skins': True,
            'export_all_influences': False,
            'export_morph': True,
            'export_morph_normal': True,
            'export_morph_tangent': False,
        })
    
    # Add Draco compression if supported and enabled
    if settings.get('export_draco_mesh_compression_enable', False):
        if blender_version >= (3, 0, 0):
            params['export_draco_mesh_compression_enable'] = True
            params['export_draco_mesh_compression_level'] = settings.get(
                'export_draco_mesh_compression_level', 6
            )
            params['export_draco_position_quantization'] = 14
            params['export_draco_normal_quantization'] = 10
            params['export_draco_texcoord_quantization'] = 12
            params['export_draco_color_quantization'] = 10
            params['export_draco_generic_quantization'] = 12
    
    # Add image format settings if available
    if 'export_image_format' in settings:
        params['export_image_format'] = settings['export_image_format']
    
    # Add image quality if specified
    if 'export_image_quality' in settings:
        if blender_version >= (3, 3, 0):
            params['export_image_quality'] = settings['export_image_quality']
    
    # Add texture size limit if specified and supported
    if 'export_texture_size_limit' in settings:
        if blender_version >= (4, 0, 0):
            params['export_image_size'] = settings['export_texture_size_limit']
    
    return params

def print_available_gltf_params():
    """Debug function to print all available GLTF export parameters"""
    import inspect
    
    print("\n[GLTF EXPORT PARAMETERS]")
    print(f"Blender Version: {bpy.app.version_string}")
    
    try:
        # Get the operator
        op = bpy.ops.export_scene.gltf
        
        # Try to get the operator's bl_rna
        if hasattr(op, 'get_rna_type'):
            rna = op.get_rna_type()
            if rna and hasattr(rna, 'properties'):
                print("\nAvailable parameters:")
                for prop in rna.properties:
                    if prop.identifier != 'rna_type':
                        print(f"  - {prop.identifier}: {prop.description}")
        else:
            print("Could not inspect operator parameters")
            
    except Exception as e:
        print(f"Error inspecting GLTF operator: {e}")