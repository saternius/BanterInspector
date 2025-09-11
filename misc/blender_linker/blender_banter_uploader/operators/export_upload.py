import bpy
from bpy.types import Operator
from bpy.props import StringProperty, EnumProperty, BoolProperty
import traceback
from ..utils import GLBExporter, BanterUploader, ValidationHelper
from .. import config

class BANTER_OT_export_upload(Operator):
    """Export selected objects as GLB and upload to Banter CDN"""
    bl_idname = "banter.export_upload"
    bl_label = "Export & Upload to Banter"
    bl_options = {'REGISTER', 'UNDO'}
    
    # Properties
    export_preset: EnumProperty(
        name="Export Preset",
        description="Preset configuration for export",
        items=[
            ('mobile_vr', "Mobile VR", "Optimized for Quest and mobile devices"),
            ('pc_vr', "PC VR", "Balanced quality for PC VR"),
            ('high_quality', "High Quality", "Maximum quality for hero assets"),
            ('custom', "Custom", "Use custom export settings"),
        ],
        default='mobile_vr'
    )
    
    combine_objects: BoolProperty(
        name="Combine Objects",
        description="Export multiple objects as single GLB",
        default=True
    )
    
    auto_copy_hash: BoolProperty(
        name="Auto Copy Hash",
        description="Automatically copy hash to clipboard",
        default=True
    )
    
    # Runtime properties (not shown in UI)
    _timer = None
    _uploading = False
    _upload_progress = 0
    _upload_status = ""
    
    def execute(self, context):
        try:
            # Get selected objects
            selected_objects = context.selected_objects.copy()
            
            if not selected_objects:
                self.report({'ERROR'}, "No objects selected")
                return {'CANCELLED'}
            
            # Validate selection
            is_valid, warnings, errors = ValidationHelper.validate_for_preset(
                selected_objects, 
                self.export_preset
            )
            
            # Report warnings
            for warning in warnings:
                self.report({'WARNING'}, warning)
            
            # Check for errors
            if not is_valid:
                for error in errors:
                    self.report({'ERROR'}, error)
                return {'CANCELLED'}
            
            # Get export settings
            if self.export_preset == 'custom':
                # Use addon preferences for custom settings
                prefs = context.preferences.addons["blender_banter_uploader"].preferences
                settings = prefs.get_custom_export_settings()
            else:
                settings = config.EXPORT_PRESETS[self.export_preset].copy()
            
            # Export to GLB
            self.report({'INFO'}, "Exporting to GLB...")
            
            try:
                filepath, glb_data = GLBExporter.export_selection(
                    selected_objects,
                    settings=settings
                )
            except Exception as e:
                self.report({'ERROR'}, f"Export failed: {str(e)}")
                return {'CANCELLED'}
            
            # Check file size
            size_mb = len(glb_data) / (1024 * 1024)
            if size_mb > config.MAX_FILE_SIZE_MB:
                self.report({'ERROR'}, f"File too large ({size_mb:.1f}MB), maximum is {config.MAX_FILE_SIZE_MB}MB")
                return {'CANCELLED'}
            
            self.report({'INFO'}, f"Exported GLB ({size_mb:.2f}MB)")
            
            # Get server URL from preferences
            prefs = context.preferences.addons["blender_banter_uploader"].preferences
            server_url = prefs.server_url
            
            # Upload to server
            self.report({'INFO'}, f"Uploading to {server_url}...")
            
            try:
                result = BanterUploader.upload_with_retry(
                    glb_data,
                    server_url=server_url,
                    max_retries=3
                )
            except Exception as e:
                self.report({'ERROR'}, f"Upload failed: {str(e)}")
                return {'CANCELLED'}
            
            # Get hash from response
            asset_hash = result.get('hash', result.get('id', 'unknown'))
            
            # Store in scene for history
            if not hasattr(context.scene, 'banter_upload_history'):
                context.scene.banter_upload_history = []
            
            context.scene.banter_upload_history.append({
                'hash': asset_hash,
                'name': selected_objects[0].name if len(selected_objects) == 1 else f"{len(selected_objects)} objects",
                'size': size_mb,
                'preset': self.export_preset
            })
            
            # Copy to clipboard if enabled
            if self.auto_copy_hash:
                context.window_manager.clipboard = asset_hash
                self.report({'INFO'}, f"Upload complete! Hash copied to clipboard: {asset_hash}")
            else:
                self.report({'INFO'}, f"Upload complete! Hash: {asset_hash}")
            
            # Store last hash for UI display
            context.scene.banter_last_upload_hash = asset_hash
            
            return {'FINISHED'}
            
        except Exception as e:
            self.report({'ERROR'}, f"Unexpected error: {str(e)}")
            print(traceback.format_exc())
            return {'CANCELLED'}
    
    def invoke(self, context, event):
        # Check server availability first
        prefs = context.preferences.addons["blender_banter_uploader"].preferences
        server_url = prefs.server_url
        
        if not BanterUploader.check_server_status(server_url):
            self.report({'ERROR'}, f"Cannot connect to server at {server_url}")
            return {'CANCELLED'}
        
        # Show dialog with options
        return context.window_manager.invoke_props_dialog(self)
    
    def draw(self, context):
        layout = self.layout
        
        # Export preset selection
        layout.prop(self, "export_preset")
        
        # Options
        layout.prop(self, "combine_objects")
        layout.prop(self, "auto_copy_hash")
        
        # Selection info
        selected_count = len(context.selected_objects)
        if selected_count > 0:
            layout.separator()
            layout.label(text=f"Selected: {selected_count} object(s)")
            
            # Show poly count
            from ..utils import GLBExporter
            poly_count = GLBExporter.get_poly_count(context.selected_objects)
            layout.label(text=f"Polygons: {poly_count:,}")
            
            # Estimate file size
            estimated_size = GLBExporter.estimate_file_size(context.selected_objects)
            size_mb = estimated_size / (1024 * 1024)
            layout.label(text=f"Estimated size: {size_mb:.2f}MB")