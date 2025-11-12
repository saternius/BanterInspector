import bpy
from .ui_panel import (
    TIPPY_PT_upload_panel,
    TIPPY_PT_history_panel,
    TIPPY_PT_settings_panel,
    TIPPY_OT_copy_hash,
    TIPPY_OT_refresh_server_status
)

classes = [
    TIPPY_OT_copy_hash,  # Register operators first
    TIPPY_OT_refresh_server_status,
    TIPPY_PT_upload_panel,
    TIPPY_PT_history_panel,
    TIPPY_PT_settings_panel,
]

def register():
    for cls in classes:
        bpy.utils.register_class(cls)

def unregister():
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)