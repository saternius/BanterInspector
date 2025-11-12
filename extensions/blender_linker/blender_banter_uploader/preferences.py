import bpy
from bpy.types import AddonPreferences
from bpy.props import StringProperty, EnumProperty, BoolProperty, IntProperty, FloatProperty
import traceback

# Debug function
def debug_print(msg):
    print(f"[TIPPY PREFS DEBUG] {msg}")

debug_print("Preferences module loading...")

try:
    from . import config
    debug_print(f"Config imported successfully")
    DEFAULT_EXPORT_PRESET = config.DEFAULT_EXPORT_PRESET
    MAX_FILE_SIZE_MB = config.MAX_FILE_SIZE_MB
except Exception as e:
    debug_print(f"ERROR importing config: {e}")
    debug_print(traceback.format_exc())
    # Fallback values
    DEFAULT_EXPORT_PRESET = "mobile_vr"
    MAX_FILE_SIZE_MB = 20

class TippyUploaderPreferences(AddonPreferences):
    bl_idname = "blender_banter_uploader"

    # Firebase configuration settings
    firebase_api_key: StringProperty(
        name="API Key",
        description="Firebase API Key",
        default=""
    )

    firebase_auth_domain: StringProperty(
        name="Auth Domain",
        description="Firebase Auth Domain (e.g., your-project.firebaseapp.com)",
        default=""
    )

    firebase_project_id: StringProperty(
        name="Project ID",
        description="Firebase Project ID",
        default=""
    )

    firebase_storage_bucket: StringProperty(
        name="Storage Bucket",
        description="Firebase Storage Bucket (e.g., your-project.appspot.com)",
        default=""
    )

    firebase_messaging_sender_id: StringProperty(
        name="Messaging Sender ID",
        description="Firebase Messaging Sender ID",
        default=""
    )

    firebase_app_id: StringProperty(
        name="App ID",
        description="Firebase App ID",
        default=""
    )

    firebase_database_url: StringProperty(
        name="Database URL",
        description="Firebase Realtime Database URL",
        default=""
    )

    # Space settings
    space_id: StringProperty(
        name="Space ID",
        description="Target space identifier (e.g., ccfaa6)",
        default=""
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
        default=DEFAULT_EXPORT_PRESET
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

        # Firebase configuration
        box = layout.box()
        box.label(text="Firebase Configuration", icon='URL')
        col = box.column(align=True)
        col.prop(self, "firebase_api_key")
        col.prop(self, "firebase_auth_domain")
        col.prop(self, "firebase_project_id")
        col.prop(self, "firebase_storage_bucket")
        col.prop(self, "firebase_messaging_sender_id")
        col.prop(self, "firebase_app_id")
        col.prop(self, "firebase_database_url")

        # Space settings
        box.separator()
        box.label(text="Space Settings", icon='LOCKED')
        box.prop(self, "space_id")

        # Test connection button
        row = box.row()
        row.operator("tippy.test_firebase_connection", icon='FILE_REFRESH')
        
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
        try:
            from . import config
            base_settings = config.EXPORT_PRESETS.get('mobile_vr', {}).copy()
        except:
            base_settings = {}
        
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


class TIPPY_OT_test_firebase_connection(bpy.types.Operator):
    """Test connection to Firebase"""
    bl_idname = "tippy.test_firebase_connection"
    bl_label = "Test Firebase Connection"

    def execute(self, context):
        try:
            prefs = context.preferences.addons["blender_banter_uploader"].preferences
            from .utils.firebase_client import FirebaseClient

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

            # Check if configuration is provided
            if not prefs.firebase_database_url or not prefs.firebase_api_key:
                self.report({'ERROR'}, "Firebase configuration incomplete. Please fill in all fields.")
                return {'CANCELLED'}

            if not prefs.space_id:
                self.report({'WARNING'}, "No Space ID configured. You'll need this for uploads.")

            # Test connection
            client = FirebaseClient(firebase_config, prefs.space_id)
            success, message = client.test_connection()

            if success:
                self.report({'INFO'}, f"Firebase connection successful! {message}")
            else:
                self.report({'ERROR'}, f"Firebase connection failed: {message}")

        except Exception as e:
            self.report({'ERROR'}, f"Error testing Firebase connection: {str(e)}")
            debug_print(f"Firebase connection test error: {e}")
            debug_print(traceback.format_exc())

        return {'FINISHED'}


def register():
    debug_print("Registering preferences classes...")
    try:
        bpy.utils.register_class(TippyUploaderPreferences)
        debug_print("  ✓ TippyUploaderPreferences registered")
    except Exception as e:
        debug_print(f"  ERROR registering TippyUploaderPreferences: {e}")
        debug_print(f"  Error type: {type(e).__name__}")
        debug_print(traceback.format_exc())
        raise

    try:
        bpy.utils.register_class(TIPPY_OT_test_firebase_connection)
        debug_print("  ✓ TIPPY_OT_test_firebase_connection registered")
    except Exception as e:
        debug_print(f"  ERROR registering TIPPY_OT_test_firebase_connection: {e}")
        raise

def unregister():
    debug_print("Unregistering preferences classes...")
    try:
        bpy.utils.unregister_class(TIPPY_OT_test_firebase_connection)
        debug_print("  ✓ TIPPY_OT_test_firebase_connection unregistered")
    except Exception as e:
        debug_print(f"  ERROR unregistering TIPPY_OT_test_firebase_connection: {e}")

    try:
        bpy.utils.unregister_class(TippyUploaderPreferences)
        debug_print("  ✓ TippyUploaderPreferences unregistered")
    except Exception as e:
        debug_print(f"  ERROR unregistering TippyUploaderPreferences: {e}")