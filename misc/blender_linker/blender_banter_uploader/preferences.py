import bpy
from bpy.types import AddonPreferences
from bpy.props import StringProperty, EnumProperty, BoolProperty, IntProperty, FloatProperty
from . import config

class BanterUploaderPreferences(AddonPreferences):
    bl_idname = __package__
    
    # Server settings
    server_url: StringProperty(
        name="Server URL",
        description="URL of the Banter microservice",
        default=config.DEFAULT_SERVER_URL,
        subtype='URL'
    )
    
    # Default export settings
    default_preset: EnumProperty(
        name="Default Export Preset",
        description="Default preset for exports",
        items=[
            ('mobile_vr', "Mobile VR", "Optimized for Quest and mobile devices"),
            ('pc_vr', "PC VR", "Balanced quality for PC VR"),
            ('high_quality', "High Quality", "Maximum quality for hero assets"),
            ('custom', "Custom", "Use custom settings below"),
        ],
        default=config.DEFAULT_EXPORT_PRESET
    )
    
    # UI settings
    auto_copy_hash: BoolProperty(
        name="Auto Copy Hash",
        description="Automatically copy hash to clipboard after upload",
        default=True
    )
    
    show_validation_warnings: BoolProperty(
        name="Show Validation Warnings",
        description="Display validation warnings before export",
        default=True
    )
    
    # Custom export settings (when preset is 'custom')
    custom_compression: BoolProperty(
        name="Enable Compression",
        description="Enable Draco mesh compression",
        default=True
    )
    
    custom_compression_level: IntProperty(
        name="Compression Level",
        description="Draco compression level (0-10)",
        default=6,
        min=0,
        max=10
    )
    
    custom_texture_limit: IntProperty(
        name="Texture Size Limit",
        description="Maximum texture dimension in pixels",
        default=2048,
        min=256,
        max=8192
    )
    
    custom_image_quality: IntProperty(
        name="Image Quality",
        description="JPEG compression quality",
        default=85,
        min=1,
        max=100
    )
    
    custom_export_animations: BoolProperty(
        name="Export Animations",
        description="Include animations in export",
        default=True
    )
    
    custom_apply_modifiers: BoolProperty(
        name="Apply Modifiers",
        description="Apply modifiers before export",
        default=True
    )
    
    # Advanced settings
    max_retries: IntProperty(
        name="Max Upload Retries",
        description="Maximum number of upload retry attempts",
        default=3,
        min=1,
        max=10
    )
    
    timeout_seconds: IntProperty(
        name="Upload Timeout",
        description="Upload timeout in seconds",
        default=60,
        min=10,
        max=300
    )
    
    def draw(self, context):
        layout = self.layout
        
        # Server settings
        box = layout.box()
        box.label(text="Server Settings", icon='URL')
        box.prop(self, "server_url")
        
        # Test connection button
        row = box.row()
        row.operator("banter.test_connection", icon='FILE_REFRESH')
        
        # Export settings
        box = layout.box()
        box.label(text="Export Settings", icon='EXPORT')
        box.prop(self, "default_preset")
        
        # Custom settings (only show if custom preset selected)
        if self.default_preset == 'custom':
            col = box.column(align=True)
            col.label(text="Custom Export Settings:")
            col.prop(self, "custom_compression")
            if self.custom_compression:
                col.prop(self, "custom_compression_level")
            col.prop(self, "custom_texture_limit")
            col.prop(self, "custom_image_quality")
            col.prop(self, "custom_export_animations")
            col.prop(self, "custom_apply_modifiers")
        
        # UI settings
        box = layout.box()
        box.label(text="Interface Settings", icon='PREFERENCES')
        box.prop(self, "auto_copy_hash")
        box.prop(self, "show_validation_warnings")
        
        # Advanced settings
        box = layout.box()
        box.label(text="Advanced Settings", icon='SETTINGS')
        box.prop(self, "max_retries")
        box.prop(self, "timeout_seconds")
    
    def get_custom_export_settings(self):
        """Get custom export settings as dictionary"""
        return {
            'export_format': 'GLB',
            'export_image_format': 'AUTO',
            'export_texture_dir': '',
            'export_texcoords': True,
            'export_normals': True,
            'export_materials': 'EXPORT',
            'export_colors': True,
            'export_cameras': False,
            'export_lights': False,
            'export_animations': self.custom_export_animations,
            'export_frame_range': False,
            'export_apply': self.custom_apply_modifiers,
            'export_draco_mesh_compression_enable': self.custom_compression,
            'export_draco_mesh_compression_level': self.custom_compression_level,
            'export_image_quality': self.custom_image_quality,
            'export_texture_size_limit': self.custom_texture_limit,
        }


class BANTER_OT_test_connection(bpy.types.Operator):
    """Test connection to Banter server"""
    bl_idname = "banter.test_connection"
    bl_label = "Test Connection"
    
    def execute(self, context):
        prefs = context.preferences.addons[__package__.split('.')[0]].preferences
        from .utils import BanterUploader
        
        if BanterUploader.check_server_status(prefs.server_url):
            self.report({'INFO'}, f"Successfully connected to {prefs.server_url}")
        else:
            self.report({'ERROR'}, f"Cannot connect to {prefs.server_url}")
        
        return {'FINISHED'}


def register():
    bpy.utils.register_class(BanterUploaderPreferences)
    bpy.utils.register_class(BANTER_OT_test_connection)

def unregister():
    bpy.utils.unregister_class(BANTER_OT_test_connection)
    bpy.utils.unregister_class(BanterUploaderPreferences)