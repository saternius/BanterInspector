import bpy
from bpy.types import Panel
from ..utils import GLBExporter
from ..utils.firebase_client import FirebaseClient
import time

class TIPPY_PT_upload_panel(Panel):
    """Main upload panel in 3D viewport sidebar"""
    bl_label = "Tippy Blender Link"
    bl_idname = "TIPPY_PT_upload_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "Tippy"

    # Cache for Firebase status to avoid spamming
    _firebase_status_cache = {}
    _cache_duration = 10.0  # Check Firebase status at most once every 10 seconds

    @classmethod
    def get_firebase_status(cls, prefs):
        """Get cached Firebase status or check if cache expired"""
        current_time = time.time()
        cache_key = f"{prefs.firebase_project_id}_{prefs.space_id}"

        # Check if we have a cached result
        if cache_key in cls._firebase_status_cache:
            cached_result, cached_time = cls._firebase_status_cache[cache_key]

            # Return cached result if still fresh (less than cache_duration seconds old)
            if current_time - cached_time < cls._cache_duration:
                return cached_result

        # Cache expired or doesn't exist, check Firebase status
        try:
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

            # Check if Firebase is configured
            if not prefs.firebase_database_url or not prefs.firebase_api_key:
                cls._firebase_status_cache[cache_key] = (False, current_time)
                return False

            client = FirebaseClient(firebase_config, prefs.space_id)
            is_connected, message = client.test_connection()
            cls._firebase_status_cache[cache_key] = (is_connected, current_time)
            return is_connected
        except Exception:
            # If check fails, cache the failure to avoid repeated attempts
            cls._firebase_status_cache[cache_key] = (False, current_time)
            return False

    def draw(self, context):
        layout = self.layout
        scene = context.scene

        # Firebase status
        prefs = context.preferences.addons["blender_banter_uploader"].preferences

        status_row = layout.row()
        status_row.label(text="Firebase:")

        # Check Firebase status (using cached value)
        is_connected = self.get_firebase_status(prefs)
        if is_connected:
            status_row.label(text="Connected", icon='CHECKMARK')
        else:
            status_row.label(text="Not Connected", icon='ERROR')

        # Add refresh button to force status check
        status_row.operator("tippy.refresh_firebase_status", text="", icon='FILE_REFRESH')

        # Show project and space info
        if prefs.firebase_project_id:
            layout.label(text=f"Project: {prefs.firebase_project_id}", icon='FILE_VOLUME')
        if prefs.space_id:
            layout.label(text=f"Space: {prefs.space_id}", icon='GROUP')
        
        layout.separator()
        
        # Selection info
        selected_count = len(context.selected_objects)
        if selected_count == 0:
            layout.label(text="No objects selected", icon='INFO')
        else:
            layout.label(text=f"Selected: {selected_count} object(s)", icon='OBJECT_DATA')
            
            # Show poly count and estimated size
            poly_count = GLBExporter.get_poly_count(context.selected_objects)
            layout.label(text=f"Polygons: {poly_count:,}")
            
            estimated_size = GLBExporter.estimate_file_size(context.selected_objects)
            size_mb = estimated_size / (1024 * 1024)
            
            size_row = layout.row()
            size_row.label(text=f"Est. Size: {size_mb:.2f}MB")
            if size_mb > 20:
                size_row.label(text="", icon='ERROR')
        
        layout.separator()
        
        # Show configuration status
        config_box = layout.box()
        config_row = config_box.row()
        config_row.label(text="Config:", icon='SETTINGS')
        if prefs.space_id and prefs.firebase_project_id:
            config_row.label(text="Complete", icon='CHECKMARK')
        else:
            config_row.label(text="Incomplete", icon='INFO')
        config_row.operator("preferences.addon_show", text="", icon='PREFERENCES').module = "blender_banter_uploader"
        
        layout.separator()
        
        # Export buttons
        col = layout.column(align=True)
        
        # Main export button
        main_btn = col.operator(
            "tippy.export_upload",
            text="Export & Upload",
            icon='EXPORT'
        )
        main_btn.export_preset = prefs.default_preset

        # Batch export button
        if selected_count > 1:
            batch_btn = col.operator(
                "tippy.batch_export",
                text=f"Batch Export ({selected_count} objects)",
                icon='COPY_ID'
            )
            batch_btn.export_preset = prefs.default_preset

        # Last upload info
        if scene.tippy_last_upload_hash:  # Now stores URL
            layout.separator()
            layout.label(text="Last Upload:", icon='CHECKMARK')

            url_box = layout.box()
            url_row = url_box.row()
            # Show shortened URL
            url_display = scene.tippy_last_upload_hash
            if len(url_display) > 40:
                url_display = url_display[:37] + "..."
            url_row.label(text=url_display)

            # Copy URL button
            url_row.operator(
                "tippy.copy_url",
                text="",
                icon='COPYDOWN'
            )


class TIPPY_PT_history_panel(Panel):
    """Upload history panel"""
    bl_label = "Upload History"
    bl_idname = "TIPPY_PT_history_panel"
    bl_parent_id = "TIPPY_PT_upload_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_options = {'DEFAULT_CLOSED'}
    
    def draw(self, context):
        layout = self.layout
        scene = context.scene
        
        # Check for batch results
        if scene.tippy_batch_results:
            layout.label(text="Recent Batch Upload:", icon='COPY_ID')

            box = layout.box()
            # Show last 5 batch results
            count = min(5, len(scene.tippy_batch_results))
            for i in range(count):
                item = scene.tippy_batch_results[-(i+1)]  # Show most recent first
                row = box.row()
                row.label(text=item.name)
                row.label(text=f"{item.size:.1f}MB")
                # Show shortened URL
                url_display = item.hash  # Now contains URL
                if len(url_display) > 20:
                    url_display = url_display[:17] + "..."
                row.label(text=url_display)

        # Show upload history if available
        if scene.tippy_upload_history:
            if scene.tippy_batch_results:
                layout.separator()

            layout.label(text="Recent Uploads:", icon='TIME')

            box = layout.box()
            # Show last 5 history items
            count = min(5, len(scene.tippy_upload_history))
            for i in range(count):
                item = scene.tippy_upload_history[-(i+1)]  # Show most recent first
                row = box.row()
                row.label(text=item.name)
                row.label(text=f"{item.size:.1f}MB")
                row.label(text=item.preset)
        else:
            layout.label(text="No upload history", icon='INFO')


class TIPPY_PT_settings_panel(Panel):
    """Quick settings panel"""
    bl_label = "Quick Settings"
    bl_idname = "TIPPY_PT_settings_panel"
    bl_parent_id = "TIPPY_PT_upload_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_options = {'DEFAULT_CLOSED'}
    
    def draw(self, context):
        layout = self.layout
        prefs = context.preferences.addons["blender_banter_uploader"].preferences

        # Default preset
        layout.prop(prefs, "default_preset")

        # Auto copy (update property name if changed)
        layout.prop(prefs, "auto_copy_hash")  # Still using old property name for compatibility

        # Firebase info (read-only in panel, change in preferences)
        if prefs.firebase_project_id:
            row = layout.row()
            row.label(text="Project:")
            row.label(text=prefs.firebase_project_id)

        if prefs.space_id:
            row = layout.row()
            row.label(text="Space:")
            row.label(text=prefs.space_id)

        # Link to preferences
        layout.operator(
            "preferences.addon_show",
            text="Open Preferences",
            icon='PREFERENCES'
        ).module = "blender_banter_uploader"


# Utility operator for copying URL (keeping old name for compatibility)
class TIPPY_OT_copy_url(bpy.types.Operator):
    """Copy URL to clipboard"""
    bl_idname = "tippy.copy_url"
    bl_label = "Copy URL"

    url_value: bpy.props.StringProperty()

    def execute(self, context):
        if self.url_value:
            context.window_manager.clipboard = self.url_value
            self.report({'INFO'}, "URL copied to clipboard")
        elif context.scene.tippy_last_upload_hash:  # Now contains URL
            context.window_manager.clipboard = context.scene.tippy_last_upload_hash
            self.report({'INFO'}, "URL copied to clipboard")
        else:
            self.report({'WARNING'}, "No URL to copy")
        return {'FINISHED'}

# Keep old operator for backward compatibility
class TIPPY_OT_copy_hash(bpy.types.Operator):
    """Copy URL to clipboard (legacy)"""
    bl_idname = "tippy.copy_hash"
    bl_label = "Copy URL"

    hash_value: bpy.props.StringProperty()

    def execute(self, context):
        # Redirect to new operator
        bpy.ops.tippy.copy_url(url_value=self.hash_value)
        return {'FINISHED'}


# Operator for manually refreshing Firebase status
class TIPPY_OT_refresh_firebase_status(bpy.types.Operator):
    """Refresh Firebase connection status"""
    bl_idname = "tippy.refresh_firebase_status"
    bl_label = "Refresh Firebase Status"

    def execute(self, context):
        prefs = context.preferences.addons["blender_banter_uploader"].preferences
        cache_key = f"{prefs.firebase_project_id}_{prefs.space_id}"

        # Clear the cache for this Firebase config to force a fresh check
        if cache_key in TIPPY_PT_upload_panel._firebase_status_cache:
            del TIPPY_PT_upload_panel._firebase_status_cache[cache_key]

        # Force a redraw of the UI
        for area in context.screen.areas:
            if area.type == 'VIEW_3D':
                area.tag_redraw()

        self.report({'INFO'}, "Firebase status refreshed")
        return {'FINISHED'}

# Keep old operator for backward compatibility
class TIPPY_OT_refresh_server_status(bpy.types.Operator):
    """Refresh Firebase connection status (legacy)"""
    bl_idname = "tippy.refresh_server_status"
    bl_label = "Refresh Status"

    def execute(self, context):
        # Redirect to new operator
        bpy.ops.tippy.refresh_firebase_status()
        return {'FINISHED'}
