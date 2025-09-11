bl_info = {
    "name": "Banter GLB Uploader",
    "author": "Banter Team",
    "version": (1, 0, 0),
    "blender": (3, 0, 0),
    "location": "View3D > Sidebar > Banter",
    "description": "Export and upload GLB files to Banter microservice CDN",
    "warning": "",
    "doc_url": "",
    "category": "Import-Export",
}

import bpy
from . import operators
from . import panels
from . import preferences
from . import config

def register():
    preferences.register()
    operators.register()
    panels.register()
    
    print("Banter GLB Uploader registered successfully")

def unregister():
    panels.unregister()
    operators.unregister()
    preferences.unregister()
    
    print("Banter GLB Uploader unregistered")

if __name__ == "__main__":
    register()