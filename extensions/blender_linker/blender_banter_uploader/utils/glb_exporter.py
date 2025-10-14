import bpy
import os
import tempfile
from pathlib import Path
from .. import config
from .blender_compat import get_gltf_export_params

class GLBExporter:
    
    @staticmethod
    def export_selection(objects, filepath=None, settings=None):
        """
        Export selected objects as GLB file.
        
        Args:
            objects: List of Blender objects to export
            filepath: Optional output filepath. If None, creates temp file
            settings: Export settings dict. If None, uses default preset
            
        Returns:
            tuple: (filepath, file_data_bytes) - Path to exported file and bytes data
        """
        if not objects:
            raise ValueError("No objects selected for export")
        
        # Use temp file if no filepath provided
        if filepath is None:
            temp_fd, filepath = tempfile.mkstemp(suffix='.glb')
            os.close(temp_fd)
            is_temp = True
        else:
            is_temp = False
        
        # Get export settings
        if settings is None:
            settings = config.EXPORT_PRESETS[config.DEFAULT_EXPORT_PRESET].copy()
        
        # Store current selection
        original_selection = bpy.context.selected_objects.copy()
        original_active = bpy.context.view_layer.objects.active
        
        try:
            # Clear selection and select only objects to export
            bpy.ops.object.select_all(action='DESELECT')
            for obj in objects:
                obj.select_set(True)
            
            if objects:
                bpy.context.view_layer.objects.active = objects[0]
            
            # Get version-compatible export parameters
            export_params = get_gltf_export_params(settings, filepath)
            
            # Export the GLB
            try:
                bpy.ops.export_scene.gltf(**export_params)
            except TypeError as e:
                # If parameters fail, try with minimal params
                print(f"Export with full params failed: {e}")
                print("Trying with minimal parameters...")
                minimal_params = {
                    'filepath': filepath,
                    'export_format': 'GLB',
                    'use_selection': True,
                }
                bpy.ops.export_scene.gltf(**minimal_params)
            
            # Read file data
            with open(filepath, 'rb') as f:
                file_data = f.read()
            
            # Clean up temp file if needed
            if is_temp:
                try:
                    os.remove(filepath)
                except:
                    pass
            
            return filepath, file_data
            
        finally:
            # Restore original selection
            bpy.ops.object.select_all(action='DESELECT')
            for obj in original_selection:
                if obj and obj.name in bpy.data.objects:
                    obj.select_set(True)
            if original_active and original_active.name in bpy.data.objects:
                bpy.context.view_layer.objects.active = original_active
    
    @staticmethod
    def export_collection(collection, filepath=None, settings=None):
        """
        Export an entire collection as GLB.
        
        Args:
            collection: Blender collection to export
            filepath: Optional output filepath
            settings: Export settings dict
            
        Returns:
            tuple: (filepath, file_data_bytes)
        """
        if not collection:
            raise ValueError("No collection provided for export")
        
        # Get all objects in collection recursively
        objects = []
        
        def get_objects_recursive(col):
            for obj in col.objects:
                objects.append(obj)
            for child_col in col.children:
                get_objects_recursive(child_col)
        
        get_objects_recursive(collection)
        
        if not objects:
            raise ValueError(f"Collection '{collection.name}' contains no objects")
        
        return GLBExporter.export_selection(objects, filepath, settings)
    
    @staticmethod
    def estimate_file_size(objects):
        """
        Estimate the file size of the GLB export.
        
        Args:
            objects: List of objects to estimate
            
        Returns:
            int: Estimated file size in bytes
        """
        total_size = 0
        
        for obj in objects:
            # Estimate mesh data
            if obj.type == 'MESH':
                mesh = obj.data
                # Rough estimate: vertices * 12 bytes + faces * 12 bytes
                vertex_size = len(mesh.vertices) * 12
                face_size = len(mesh.polygons) * 12
                total_size += vertex_size + face_size
                
                # Add material/texture estimates
                for mat_slot in obj.material_slots:
                    if mat_slot.material:
                        # Add rough texture size estimate (1MB per texture)
                        total_size += 1024 * 1024
        
        # Add overhead for GLB structure (roughly 20%)
        total_size = int(total_size * 1.2)
        
        return total_size
    
    @staticmethod
    def get_poly_count(objects):
        """
        Get total polygon count for objects.
        
        Args:
            objects: List of objects to count
            
        Returns:
            int: Total polygon count
        """
        total_polys = 0
        
        for obj in objects:
            if obj.type == 'MESH':
                total_polys += len(obj.data.polygons)
        
        return total_polys