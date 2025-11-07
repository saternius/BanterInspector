import bpy
from bpy.types import Panel
from ..utils import BanterUploader, GLBExporter
import time

class BANTER_PT_upload_panel(Panel):
    """Main upload panel in 3D viewport sidebar"""
    bl_label = "Banter GLB Uploader"
    bl_idname = "BANTER_PT_upload_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "Banter"

    # Cache for server status to avoid spamming
    _server_status_cache = {}
    _cache_duration = 10.0  # Check server status at most once every 10 seconds

    @classmethod
    def get_server_status(cls, server_url):
        """Get cached server status or check if cache expired"""
        current_time = time.time()

        # Check if we have a cached result
        if server_url in cls._server_status_cache:
            cached_result, cached_time = cls._server_status_cache[server_url]

            # Return cached result if still fresh (less than cache_duration seconds old)
            if current_time - cached_time < cls._cache_duration:
                return cached_result

        # Cache expired or doesn't exist, check server status
        try:
            is_connected = BanterUploader.check_server_status(server_url)
            cls._server_status_cache[server_url] = (is_connected, current_time)
            return is_connected
        except Exception:
            # If check fails, cache the failure to avoid repeated attempts
            cls._server_status_cache[server_url] = (False, current_time)
            return False

    def draw(self, context):
        layout = self.layout
        scene = context.scene

        # Server status
        prefs = context.preferences.addons["blender_banter_uploader"].preferences
        server_url = prefs.server_url

        status_row = layout.row()
        status_row.label(text="Server:")

        # Check server status (using cached value)
        is_connected = self.get_server_status(server_url)
        if is_connected:
            status_row.label(text="Connected", icon='CHECKMARK')
        else:
            status_row.label(text="Disconnected", icon='ERROR')

        # Add refresh button to force status check
        status_row.operator("banter.refresh_server_status", text="", icon='FILE_REFRESH')
        
        layout.label(text=server_url, icon='URL')
        
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
        
        # Show authentication status
        auth_box = layout.box()
        auth_row = auth_box.row()
        auth_row.label(text="Auth:", icon='LOCKED')
        if prefs.username:
            auth_row.label(text=f"{prefs.username}", icon='CHECKMARK')
        else:
            auth_row.label(text="Not set", icon='INFO')
        auth_row.operator("preferences.addon_show", text="", icon='PREFERENCES').module = "blender_banter_uploader"
        
        layout.separator()
        
        # Export buttons
        col = layout.column(align=True)
        
        # Main export button
        main_btn = col.operator(
            "banter.export_upload",
            text="Export & Upload",
            icon='EXPORT'
        )
        main_btn.export_preset = prefs.default_preset
        
        # Batch export button
        if selected_count > 1:
            batch_btn = col.operator(
                "banter.batch_export",
                text=f"Batch Export ({selected_count} objects)",
                icon='COPY_ID'
            )
            batch_btn.export_preset = prefs.default_preset
        
        # Last upload info
        if scene.banter_last_upload_hash:
            layout.separator()
            layout.label(text="Last Upload:", icon='CHECKMARK')
            
            hash_box = layout.box()
            hash_row = hash_box.row()
            hash_row.label(text=scene.banter_last_upload_hash[:16] + "...")
            
            # Copy hash button
            hash_row.operator(
                "banter.copy_hash",
                text="",
                icon='COPYDOWN'
            )


class BANTER_PT_history_panel(Panel):
    """Upload history panel"""
    bl_label = "Upload History"
    bl_idname = "BANTER_PT_history_panel"
    bl_parent_id = "BANTER_PT_upload_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_options = {'DEFAULT_CLOSED'}
    
    def draw(self, context):
        layout = self.layout
        scene = context.scene
        
        # Check for batch results
        if scene.banter_batch_results:
            layout.label(text="Recent Batch Upload:", icon='COPY_ID')
            
            box = layout.box()
            # Show last 5 batch results
            count = min(5, len(scene.banter_batch_results))
            for i in range(count):
                item = scene.banter_batch_results[-(i+1)]  # Show most recent first
                row = box.row()
                row.label(text=item.name)
                row.label(text=f"{item.size:.1f}MB")
                row.label(text=item.hash[:8] + "...")
        
        # Show upload history if available
        if scene.banter_upload_history:
            if scene.banter_batch_results:
                layout.separator()
            
            layout.label(text="Recent Uploads:", icon='TIME')
            
            box = layout.box()
            # Show last 5 history items
            count = min(5, len(scene.banter_upload_history))
            for i in range(count):
                item = scene.banter_upload_history[-(i+1)]  # Show most recent first
                row = box.row()
                row.label(text=item.name)
                row.label(text=f"{item.size:.1f}MB")
                row.label(text=item.preset)
        else:
            layout.label(text="No upload history", icon='INFO')


class BANTER_PT_settings_panel(Panel):
    """Quick settings panel"""
    bl_label = "Quick Settings"
    bl_idname = "BANTER_PT_settings_panel"
    bl_parent_id = "BANTER_PT_upload_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_options = {'DEFAULT_CLOSED'}
    
    def draw(self, context):
        layout = self.layout
        prefs = context.preferences.addons["blender_banter_uploader"].preferences
        
        # Default preset
        layout.prop(prefs, "default_preset")
        
        # Auto copy
        layout.prop(prefs, "auto_copy_hash")
        
        # Server URL (read-only in panel, change in preferences)
        row = layout.row()
        row.label(text="Server URL:")
        row.label(text=prefs.server_url)
        
        # Link to preferences
        layout.operator(
            "preferences.addon_show",
            text="Open Preferences",
            icon='PREFERENCES'
        ).module = "blender_banter_uploader"


# Utility operator for copying hash
class BANTER_OT_copy_hash(bpy.types.Operator):
    """Copy hash to clipboard"""
    bl_idname = "banter.copy_hash"
    bl_label = "Copy Hash"

    hash_value: bpy.props.StringProperty()

    def execute(self, context):
        if self.hash_value:
            context.window_manager.clipboard = self.hash_value
            self.report({'INFO'}, f"Copied: {self.hash_value}")
        elif context.scene.banter_last_upload_hash:
            context.window_manager.clipboard = context.scene.banter_last_upload_hash
            self.report({'INFO'}, f"Copied: {context.scene.banter_last_upload_hash}")
        else:
            self.report({'WARNING'}, "No hash to copy")
        return {'FINISHED'}


# Operator for manually refreshing server status
class BANTER_OT_refresh_server_status(bpy.types.Operator):
    """Refresh server connection status"""
    bl_idname = "banter.refresh_server_status"
    bl_label = "Refresh Server Status"

    def execute(self, context):
        prefs = context.preferences.addons["blender_banter_uploader"].preferences
        server_url = prefs.server_url

        # Clear the cache for this server URL to force a fresh check
        if server_url in BANTER_PT_upload_panel._server_status_cache:
            del BANTER_PT_upload_panel._server_status_cache[server_url]

        # Force a redraw of the UI
        for area in context.screen.areas:
            if area.type == 'VIEW_3D':
                area.tag_redraw()

        self.report({'INFO'}, "Server status refreshed")
        return {'FINISHED'}
