import bpy
from .export_upload import BANTER_OT_export_upload
from .batch_export import BANTER_OT_batch_export

classes = [
    BANTER_OT_export_upload,
    BANTER_OT_batch_export,
]

def register():
    for cls in classes:
        bpy.utils.register_class(cls)

def unregister():
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)