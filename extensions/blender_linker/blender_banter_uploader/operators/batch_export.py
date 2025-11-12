import bpy
from bpy.types import Operator
from bpy.props import StringProperty, EnumProperty, BoolProperty
import traceback
from ..utils import GLBExporter, ValidationHelper
from ..utils.firebase_client import FirebaseClient, get_transform_data
from .. import config

class TIPPY_OT_batch_export(Operator):
    """Export multiple objects as separate GLB files and upload to Firebase"""
    bl_idname = "tippy.batch_export"
    bl_label = "Batch Export & Upload to Firebase"
    bl_options = {'REGISTER', 'UNDO'}
    
    # Properties
    export_mode: EnumProperty(
        name="Export Mode",
        description="How to batch export objects",
        items=[
            ('individual', "Individual Objects", "Export each object separately"),
            ('collections', "By Collection", "Export each collection as one GLB"),
            ('hierarchy', "Top-Level Only", "Export top-level objects with children"),
        ],
        default='individual'
    )
    
    export_preset: EnumProperty(
        name="Export Preset",
        description="Preset configuration for export",
        items=[
            ('mobile_vr', "Mobile VR", "Optimized for Quest and mobile devices"),
            ('pc_vr', "PC VR", "Balanced quality for PC VR"),
            ('high_quality', "High Quality", "Maximum quality for hero assets"),
        ],
        default='mobile_vr'
    )
    
    skip_failed: BoolProperty(
        name="Skip Failed Exports",
        description="Continue with next object if one fails",
        default=True
    )
    
    def execute(self, context):
        try:
            # Determine what to export based on mode
            export_items = []
            
            if self.export_mode == 'individual':
                # Export each selected object separately
                for obj in context.selected_objects:
                    export_items.append({
                        'name': obj.name,
                        'objects': [obj]
                    })
                    
            elif self.export_mode == 'collections':
                # Group by collection
                collections_dict = {}
                for obj in context.selected_objects:
                    for col in obj.users_collection:
                        if col.name not in collections_dict:
                            collections_dict[col.name] = []
                        collections_dict[col.name].append(obj)
                
                for col_name, objects in collections_dict.items():
                    export_items.append({
                        'name': col_name,
                        'objects': objects
                    })
                    
            elif self.export_mode == 'hierarchy':
                # Only export top-level objects (with their children)
                top_level = [obj for obj in context.selected_objects if obj.parent not in context.selected_objects]
                
                for obj in top_level:
                    # Get object and all children
                    objects = [obj]
                    objects.extend(self.get_all_children(obj))
                    
                    export_items.append({
                        'name': obj.name,
                        'objects': objects
                    })
            
            if not export_items:
                self.report({'ERROR'}, "No objects to export")
                return {'CANCELLED'}
            
            # Get settings
            settings = config.EXPORT_PRESETS[self.export_preset].copy()
            prefs = context.preferences.addons["blender_banter_uploader"].preferences

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

            # Check configuration
            if not prefs.firebase_database_url or not prefs.firebase_storage_bucket:
                self.report({'ERROR'}, "Firebase configuration incomplete. Please configure in addon preferences.")
                return {'CANCELLED'}

            if not prefs.space_id:
                self.report({'ERROR'}, "No Space ID configured. Please set Space ID in addon preferences.")
                return {'CANCELLED'}

            # Initialize Firebase client
            client = FirebaseClient(firebase_config, prefs.space_id)
            
            # Process each item
            successful = []
            failed = []
            
            for i, item in enumerate(export_items):
                self.report({'INFO'}, f"Processing {i+1}/{len(export_items)}: {item['name']}")
                
                try:
                    # Validate
                    is_valid, warnings, errors = ValidationHelper.validate_for_preset(
                        item['objects'],
                        self.export_preset
                    )
                    
                    if not is_valid and not self.skip_failed:
                        for error in errors:
                            self.report({'ERROR'}, f"{item['name']}: {error}")
                        return {'CANCELLED'}
                    elif not is_valid:
                        failed.append(item['name'])
                        for error in errors:
                            self.report({'WARNING'}, f"{item['name']}: {error}")
                        continue
                    
                    # Export
                    filepath, glb_data = GLBExporter.export_selection(
                        item['objects'],
                        settings=settings
                    )
                    
                    # Check size
                    size_mb = len(glb_data) / (1024 * 1024)
                    if size_mb > config.MAX_FILE_SIZE_MB:
                        if not self.skip_failed:
                            self.report({'ERROR'}, f"{item['name']}: File too large ({size_mb:.1f}MB)")
                            return {'CANCELLED'}
                        else:
                            failed.append(item['name'])
                            self.report({'WARNING'}, f"{item['name']}: File too large ({size_mb:.1f}MB)")
                            continue
                    
                    # Get transform data from first object in the group
                    transform = None
                    if item['objects']:
                        transform = get_transform_data(item['objects'][0])

                    # Upload to Firebase with mesh name
                    result = client.upload_with_retry(
                        glb_data,
                        mesh_name=item['name'],  # Use the item name as mesh name
                        transform=transform,
                        max_retries=prefs.max_retries
                    )

                    if not result.get('success'):
                        raise Exception(result.get('error', 'Unknown error'))

                    storage_url = result.get('storage_url', 'unknown')
                    component_id = result.get('component_id', 'unknown')

                    successful.append({
                        'name': item['name'],
                        'url': storage_url,
                        'component_id': component_id,
                        'size': size_mb
                    })

                    self.report({'INFO'}, f"{item['name']}: Uploaded successfully to Firebase")
                    
                except Exception as e:
                    if not self.skip_failed:
                        self.report({'ERROR'}, f"{item['name']}: {str(e)}")
                        return {'CANCELLED'}
                    else:
                        failed.append(item['name'])
                        self.report({'WARNING'}, f"{item['name']}: {str(e)}")
            
            # Report results
            self.report({'INFO'}, f"Batch export complete: {len(successful)} successful, {len(failed)} failed")
            
            # Store results in scene using proper Blender properties
            # Clear previous results
            context.scene.tippy_batch_results.clear()

            # Add new results
            for item in successful:
                result_item = context.scene.tippy_batch_results.add()
                result_item.name = item['name']
                result_item.hash = item['url']  # Store URL in hash field for compatibility
                result_item.size = item['size']

            # Copy all URLs to clipboard
            if successful:
                urls = [f"{item['name']}: {item['url']}" for item in successful]
                context.window_manager.clipboard = "\n".join(urls)
                self.report({'INFO'}, "All URLs copied to clipboard")
            
            return {'FINISHED'}
            
        except Exception as e:
            self.report({'ERROR'}, f"Batch export failed: {str(e)}")
            print(traceback.format_exc())
            return {'CANCELLED'}
    
    def get_all_children(self, obj):
        """Recursively get all children of an object"""
        children = []
        for child in obj.children:
            children.append(child)
            children.extend(self.get_all_children(child))
        return children
    
    def invoke(self, context, event):
        # Check if multiple objects selected
        if len(context.selected_objects) < 2:
            self.report({'WARNING'}, "Batch export requires multiple objects selected")
        
        return context.window_manager.invoke_props_dialog(self)
    
    def draw(self, context):
        layout = self.layout
        
        layout.prop(self, "export_mode")
        layout.prop(self, "export_preset")
        layout.prop(self, "skip_failed")
        
        # Show selection info
        selected_count = len(context.selected_objects)
        layout.separator()
        layout.label(text=f"Selected: {selected_count} object(s)")
        
        # Preview what will be exported
        if self.export_mode == 'collections':
            collections = set()
            for obj in context.selected_objects:
                collections.update(col.name for col in obj.users_collection)
            layout.label(text=f"Will export {len(collections)} collection(s)")
        elif self.export_mode == 'hierarchy':
            top_level = [obj for obj in context.selected_objects if obj.parent not in context.selected_objects]
            layout.label(text=f"Will export {len(top_level)} top-level object(s)")
        else:
            layout.label(text=f"Will export {selected_count} individual object(s)")