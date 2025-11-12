# Firebase configuration template
# Users should fill these values in the addon preferences
FIREBASE_CONFIG_TEMPLATE = {
    "apiKey": "",  # Your Firebase API Key
    "authDomain": "",  # e.g., "your-project.firebaseapp.com"
    "projectId": "",  # Your Firebase Project ID
    "storageBucket": "",  # e.g., "your-project.appspot.com"
    "messagingSenderId": "",  # Your messaging sender ID
    "appId": "",  # Your Firebase app ID
    "databaseURL": ""  # e.g., "https://your-project-default-rtdb.firebaseio.com"
}

MAX_FILE_SIZE_MB = 40
TEMP_DIR = None  # Use system temp

EXPORT_PRESETS = {
    "mobile_vr": {
        'export_format': 'GLB',
        'export_image_format': 'AUTO',
        'export_texture_dir': '',
        'export_texcoords': True,
        'export_normals': True,
        'export_materials': 'EXPORT',
        'export_colors': True,
        'export_cameras': False,
        'export_lights': False,
        'export_animations': True,
        'export_frame_range': False,
        'export_apply': True,
        'export_draco_mesh_compression_enable': True,
        'export_draco_mesh_compression_level': 6,
        'export_image_quality': 75,
        'export_texture_size_limit': 1024,
    },
    "pc_vr": {
        'export_format': 'GLB',
        'export_image_format': 'AUTO',
        'export_texture_dir': '',
        'export_texcoords': True,
        'export_normals': True,
        'export_materials': 'EXPORT',
        'export_colors': True,
        'export_cameras': False,
        'export_lights': False,
        'export_animations': True,
        'export_frame_range': False,
        'export_apply': True,
        'export_draco_mesh_compression_enable': True,
        'export_draco_mesh_compression_level': 4,
        'export_image_quality': 85,
        'export_texture_size_limit': 2048,
    },
    "high_quality": {
        'export_format': 'GLB',
        'export_image_format': 'AUTO',
        'export_texture_dir': '',
        'export_texcoords': True,
        'export_normals': True,
        'export_materials': 'EXPORT',
        'export_colors': True,
        'export_cameras': False,
        'export_lights': False,
        'export_animations': True,
        'export_frame_range': False,
        'export_apply': True,
        'export_draco_mesh_compression_enable': False,
        'export_image_quality': 95,
        'export_texture_size_limit': 4096,
    }
}

DEFAULT_EXPORT_PRESET = "mobile_vr"

# Validation thresholds
MAX_POLY_COUNT_MOBILE_VR = 100000
MAX_POLY_COUNT_PC_VR = 500000
WARN_TEXTURE_SIZE = 2048