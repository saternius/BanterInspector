import bpy
from .export_upload import TIPPY_OT_export_upload
from .batch_export import TIPPY_OT_batch_export

classes = [
    TIPPY_OT_export_upload,
    TIPPY_OT_batch_export,
]

def register():
    for cls in classes:
        bpy.utils.register_class(cls)

def unregister():
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)