import bpy
from .ui_panel import (
    BANTER_PT_upload_panel,
    BANTER_PT_history_panel,
    BANTER_PT_settings_panel,
    BANTER_OT_copy_hash,
    BANTER_OT_refresh_server_status
)

classes = [
    BANTER_OT_copy_hash,  # Register operators first
    BANTER_OT_refresh_server_status,
    BANTER_PT_upload_panel,
    BANTER_PT_history_panel,
    BANTER_PT_settings_panel,
]

def register():
    for cls in classes:
        bpy.utils.register_class(cls)

def unregister():
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)