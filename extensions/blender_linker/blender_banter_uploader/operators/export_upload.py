import bpy
from bpy.types import Operator
from bpy.props import StringProperty, EnumProperty, BoolProperty
import traceback
from ..utils import GLBExporter, ValidationHelper
from ..utils.firebase_client import FirebaseClient, get_transform_data
from .. import config

class TIPPY_OT_export_upload(Operator):
    """Export selected objects as GLB and upload to Firebase"""
    bl_idname = "tippy.export_upload"
    bl_label = "Export & Upload to Firebase"
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

    auto_copy_url: BoolProperty(
        name="Auto Copy URL",
        description="Automatically copy URL to clipboard",
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

            # Get Firebase configuration from preferences
            prefs = context.preferences.addons["blender_banter_uploader"].preferences

            # Build Firebase config
            firebase_config = {
                'apiKey': prefs.firebase_api_key,
                'authDomain': prefs.firebase_auth_domain,
                'projectId': prefs.firebase_project_id,
                'storageBucket': prefs.firebase_storage_bucket,
                'messagingSenderId': prefs.firebase_messaging_sender_id,
                'appId': prefs.firebase_app_id,
                'databaseURL': prefs.firebase_database_url
            }

            # Check configuration
            if not prefs.firebase_database_url or not prefs.firebase_storage_bucket:
                self.report({'ERROR'}, "Firebase configuration incomplete. Please configure in addon preferences.")
                return {'CANCELLED'}

            if not prefs.space_id:
                self.report({'ERROR'}, "No Space ID configured. Please set Space ID in addon preferences.")
                return {'CANCELLED'}

            # Determine mesh name - use single object name or generic name for multiple
            if len(selected_objects) == 1:
                mesh_name = selected_objects[0].name
            else:
                mesh_name = f"Combined_{len(selected_objects)}_objects"

            # Get transform data from the active object
            transform = None
            if context.active_object:
                transform = get_transform_data(context.active_object)

            # Initialize Firebase client
            client = FirebaseClient(firebase_config, prefs.space_id)

            # Upload to Firebase
            self.report({'INFO'}, f"Uploading '{mesh_name}' to Firebase...")

            try:
                result = client.upload_with_retry(
                    glb_data,
                    mesh_name=mesh_name,
                    transform=transform,
                    max_retries=prefs.max_retries
                )
            except Exception as e:
                self.report({'ERROR'}, f"Firebase upload failed: {str(e)}")
                return {'CANCELLED'}

            # Check result
            if not result.get('success'):
                self.report({'ERROR'}, f"Upload failed: {result.get('error', 'Unknown error')}")
                return {'CANCELLED'}

            # Get URL and component ID from response
            storage_url = result.get('storage_url', 'unknown')
            component_id = result.get('component_id', 'unknown')
            
            # Store in scene for history using proper Blender properties
            history_item = context.scene.tippy_upload_history.add()
            history_item.hash = storage_url  # Store URL in hash field for compatibility
            history_item.name = selected_objects[0].name if len(selected_objects) == 1 else f"{len(selected_objects)} objects"
            history_item.size = size_mb
            history_item.preset = self.export_preset

            # Keep history limited to last 20 items
            while len(context.scene.tippy_upload_history) > 20:
                context.scene.tippy_upload_history.remove(0)

            # Copy to clipboard if enabled
            if self.auto_copy_url:
                context.window_manager.clipboard = storage_url
                self.report({'INFO'}, f"Upload complete! URL copied to clipboard: {storage_url}")
            else:
                self.report({'INFO'}, f"Upload complete! URL: {storage_url}")

            # Store last upload URL for UI display
            context.scene.tippy_last_upload_hash = storage_url

            return {'FINISHED'}

        except Exception as e:
            self.report({'ERROR'}, f"Unexpected error: {str(e)}")
            print(traceback.format_exc())
            return {'CANCELLED'}

    def invoke(self, context, event):
        # Check Firebase configuration
        prefs = context.preferences.addons["blender_banter_uploader"].preferences

        # Check if Firebase is configured
        if not prefs.firebase_database_url or not prefs.firebase_storage_bucket:
            self.report({'ERROR'}, "Firebase not configured. Please set up Firebase in addon preferences.")
            return {'CANCELLED'}

        # Warn if no space ID is set
        if not prefs.space_id:
            self.report({'ERROR'}, "No Space ID configured. Please set Space ID in addon preferences.")
            return {'CANCELLED'}

        # Show dialog with options
        return context.window_manager.invoke_props_dialog(self, width=400)
    
    def draw(self, context):
        layout = self.layout
        prefs = context.preferences.addons["blender_banter_uploader"].preferences

        # Export preset selection
        layout.prop(self, "export_preset")

        # Options
        layout.prop(self, "combine_objects")
        layout.prop(self, "auto_copy_url")

        # Firebase status section
        layout.separator()
        box = layout.box()
        box.label(text="Firebase Settings", icon='URL')

        # Show current space status
        if prefs.space_id:
            box.label(text=f"Space ID: {prefs.space_id}", icon='CHECKMARK')
        else:
            box.label(text="No Space ID configured", icon='ERROR')

        # Show Firebase project
        if prefs.firebase_project_id:
            box.label(text=f"Project: {prefs.firebase_project_id}", icon='FILE_VOLUME')
        
        # Selection info
        layout.separator()
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