"""
Scene properties for storing upload history and state
"""

import bpy
from bpy.props import StringProperty, CollectionProperty, FloatProperty
from bpy.types import PropertyGroup

class UploadHistoryItem(PropertyGroup):
    """Single upload history entry"""
    hash: StringProperty(
        name="URL",
        description="Firebase Storage URL (stored in hash field for compatibility)"
    )
    name: StringProperty(
        name="Name",
        description="Object or collection name"
    )
    size: FloatProperty(
        name="Size",
        description="File size in MB"
    )
    preset: StringProperty(
        name="Preset",
        description="Export preset used"
    )
    component_id: StringProperty(
        name="Component ID",
        description="Firebase component ID",
        default=""
    )

class BatchResultItem(PropertyGroup):
    """Batch upload result entry"""
    name: StringProperty(
        name="Name",
        description="Object name"
    )
    hash: StringProperty(
        name="URL",
        description="Firebase Storage URL (stored in hash field for compatibility)"
    )
    size: FloatProperty(
        name="Size",
        description="File size in MB"
    )
    component_id: StringProperty(
        name="Component ID",
        description="Firebase component ID",
        default=""
    )

def register():
    """Register scene properties"""
    bpy.utils.register_class(UploadHistoryItem)
    bpy.utils.register_class(BatchResultItem)
    
    # Add properties to Scene type
    bpy.types.Scene.tippy_upload_history = CollectionProperty(
        type=UploadHistoryItem,
        name="Upload History",
        description="History of uploaded assets"
    )

    bpy.types.Scene.tippy_batch_results = CollectionProperty(
        type=BatchResultItem,
        name="Batch Results",
        description="Results from last batch upload"
    )

    bpy.types.Scene.tippy_last_upload_hash = StringProperty(
        name="Last Upload URL",
        description="Firebase Storage URL of the last uploaded asset (stored in hash field for compatibility)",
        default=""
    )

def unregister():
    """Unregister scene properties"""
    # Remove properties from Scene type
    if hasattr(bpy.types.Scene, 'tippy_last_upload_hash'):
        del bpy.types.Scene.tippy_last_upload_hash
    if hasattr(bpy.types.Scene, 'tippy_batch_results'):
        del bpy.types.Scene.tippy_batch_results
    if hasattr(bpy.types.Scene, 'tippy_upload_history'):
        del bpy.types.Scene.tippy_upload_history

    # Unregister classes
    bpy.utils.unregister_class(BatchResultItem)
    bpy.utils.unregister_class(UploadHistoryItem)