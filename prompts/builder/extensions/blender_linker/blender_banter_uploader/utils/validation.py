import bpy
from .. import config

class ValidationHelper:
    
    @staticmethod
    def validate_selection(objects):
        """
        Validate objects for export.
        
        Args:
            objects: List of objects to validate
            
        Returns:
            tuple: (is_valid, warnings, errors)
        """
        warnings = []
        errors = []
        
        if not objects:
            errors.append("No objects selected")
            return False, warnings, errors
        
        # Check for mesh data
        has_mesh = False
        for obj in objects:
            if obj.type == 'MESH':
                has_mesh = True
                break
        
        if not has_mesh:
            errors.append("Selection contains no mesh objects")
        
        # Check polygon count
        from .glb_exporter import GLBExporter
        poly_count = GLBExporter.get_poly_count(objects)
        
        if poly_count > config.MAX_POLY_COUNT_PC_VR:
            warnings.append(f"High polygon count ({poly_count:,}) may impact performance")
        elif poly_count > config.MAX_POLY_COUNT_MOBILE_VR:
            warnings.append(f"Polygon count ({poly_count:,}) exceeds mobile VR recommendation")
        
        # Check for missing textures
        missing_textures = ValidationHelper.check_missing_textures(objects)
        if missing_textures:
            warnings.append(f"Missing textures: {', '.join(missing_textures)}")
        
        # Estimate file size
        estimated_size = GLBExporter.estimate_file_size(objects)
        size_mb = estimated_size / (1024 * 1024)
        
        if size_mb > config.MAX_FILE_SIZE_MB:
            errors.append(f"Estimated file size ({size_mb:.1f}MB) exceeds maximum ({config.MAX_FILE_SIZE_MB}MB)")
        elif size_mb > config.MAX_FILE_SIZE_MB * 0.8:
            warnings.append(f"File size ({size_mb:.1f}MB) approaching maximum limit")
        
        # Check for modifiers that might cause issues
        problematic_modifiers = ValidationHelper.check_modifiers(objects)
        if problematic_modifiers:
            warnings.append(f"Objects have modifiers that will be applied: {', '.join(problematic_modifiers)}")
        
        # Determine if valid
        is_valid = len(errors) == 0
        
        return is_valid, warnings, errors
    
    @staticmethod
    def check_missing_textures(objects):
        """
        Check for missing texture files.
        
        Args:
            objects: List of objects to check
            
        Returns:
            list: Names of missing textures
        """
        missing = []
        checked = set()
        
        for obj in objects:
            if obj.type != 'MESH':
                continue
            
            for mat_slot in obj.material_slots:
                if not mat_slot.material:
                    continue
                
                mat = mat_slot.material
                if mat.name in checked:
                    continue
                checked.add(mat.name)
                
                # Check material nodes for image textures
                if mat.use_nodes:
                    for node in mat.node_tree.nodes:
                        if node.type == 'TEX_IMAGE' and node.image:
                            if node.image.packed_file is None:
                                # Check if external file exists
                                try:
                                    if node.image.filepath:
                                        import os
                                        filepath = bpy.path.abspath(node.image.filepath)
                                        if not os.path.exists(filepath):
                                            missing.append(node.image.name)
                                except:
                                    missing.append(node.image.name)
        
        return missing
    
    @staticmethod
    def check_modifiers(objects):
        """
        Check for modifiers that will be applied.
        
        Args:
            objects: List of objects to check
            
        Returns:
            list: Names of objects with modifiers
        """
        objects_with_modifiers = []
        
        for obj in objects:
            if obj.type == 'MESH' and obj.modifiers:
                # Check for visible modifiers
                visible_modifiers = [m for m in obj.modifiers if m.show_viewport]
                if visible_modifiers:
                    objects_with_modifiers.append(obj.name)
        
        return objects_with_modifiers
    
    @staticmethod
    def check_texture_sizes(objects):
        """
        Check texture sizes and return those exceeding limits.
        
        Args:
            objects: List of objects to check
            
        Returns:
            dict: Textures exceeding size limits
        """
        large_textures = {}
        checked = set()
        
        for obj in objects:
            if obj.type != 'MESH':
                continue
            
            for mat_slot in obj.material_slots:
                if not mat_slot.material:
                    continue
                
                mat = mat_slot.material
                if mat.name in checked:
                    continue
                checked.add(mat.name)
                
                if mat.use_nodes:
                    for node in mat.node_tree.nodes:
                        if node.type == 'TEX_IMAGE' and node.image:
                            width = node.image.size[0]
                            height = node.image.size[1]
                            max_dim = max(width, height)
                            
                            if max_dim > config.WARN_TEXTURE_SIZE:
                                large_textures[node.image.name] = (width, height)
        
        return large_textures
    
    @staticmethod
    def validate_for_preset(objects, preset_name):
        """
        Validate objects against a specific export preset.
        
        Args:
            objects: List of objects to validate
            preset_name: Name of the preset to validate against
            
        Returns:
            tuple: (is_valid, warnings, errors)
        """
        if preset_name not in config.EXPORT_PRESETS:
            return False, [], [f"Unknown preset: {preset_name}"]
        
        preset = config.EXPORT_PRESETS[preset_name]
        warnings = []
        errors = []
        
        # Basic validation first
        is_valid, base_warnings, base_errors = ValidationHelper.validate_selection(objects)
        warnings.extend(base_warnings)
        errors.extend(base_errors)
        
        # Check texture size limits for preset
        texture_limit = preset.get('export_texture_size_limit', 4096)
        large_textures = ValidationHelper.check_texture_sizes(objects)
        
        for tex_name, (width, height) in large_textures.items():
            max_dim = max(width, height)
            if max_dim > texture_limit:
                warnings.append(
                    f"Texture '{tex_name}' ({width}x{height}) exceeds "
                    f"preset limit ({texture_limit}x{texture_limit})"
                )
        
        # Check poly count for preset
        from .glb_exporter import GLBExporter
        poly_count = GLBExporter.get_poly_count(objects)
        
        if preset_name == 'mobile_vr' and poly_count > config.MAX_POLY_COUNT_MOBILE_VR:
            warnings.append(f"Polygon count ({poly_count:,}) exceeds mobile VR recommendation")
        
        return len(errors) == 0, warnings, errors