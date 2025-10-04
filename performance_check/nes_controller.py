import bpy
import bmesh
import math

# Clear existing objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Create main controller body
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
controller_body = bpy.context.active_object
controller_body.name = "ControllerBody"
controller_body.scale = (0.12, 0.05, 0.06)

# Apply scale to mesh data so children aren't affected by parent scale
bpy.context.view_layer.objects.active = controller_body
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# Create materials
def create_material(name, color):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value = 0.6
    return mat

gray_mat = create_material("Gray", (0.5, 0.5, 0.5, 1.0))
dark_gray_mat = create_material("DarkGray", (0.2, 0.2, 0.2, 1.0))
red_mat = create_material("Red", (0.8, 0.1, 0.1, 1.0))
maroon_mat = create_material("Maroon", (0.5, 0.05, 0.05, 1.0))

# Apply gray material to body
if controller_body.data.materials:
    controller_body.data.materials[0] = gray_mat
else:
    controller_body.data.materials.append(gray_mat)

# Create D-pad center
bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=0.003, location=(-0.035, 0, 0.031))
dpad_center = bpy.context.active_object
dpad_center.name = "DPadCenter"
dpad_center.data.materials.append(dark_gray_mat)
dpad_center.parent = controller_body

# Create D-pad directional buttons
dpad_positions = [
    (-0.035, 0.012, 0.031, "DPadUp"),      # Up
    (-0.035, -0.012, 0.031, "DPadDown"),   # Down
    (-0.023, 0, 0.031, "DPadRight"),       # Right
    (-0.047, 0, 0.031, "DPadLeft")         # Left
]

for x, y, z, name in dpad_positions:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    dpad_btn = bpy.context.active_object
    dpad_btn.name = name
    if "Up" in name or "Down" in name:
        dpad_btn.scale = (0.006, 0.008, 0.002)
    else:
        dpad_btn.scale = (0.008, 0.006, 0.002)
    dpad_btn.data.materials.append(dark_gray_mat)
    dpad_btn.parent = controller_body

# Create A button (right, larger)
bpy.ops.mesh.primitive_cylinder_add(radius=0.01, depth=0.004, location=(0.045, -0.01, 0.032))
a_button = bpy.context.active_object
a_button.name = "ButtonA"
a_button.data.materials.append(maroon_mat)
a_button.parent = controller_body

# Create B button (left, larger)
bpy.ops.mesh.primitive_cylinder_add(radius=0.01, depth=0.004, location=(0.025, 0, 0.032))
b_button = bpy.context.active_object
b_button.name = "ButtonB"
b_button.data.materials.append(maroon_mat)
b_button.parent = controller_body

# Create Start button
bpy.ops.mesh.primitive_cube_add(size=1, location=(0.008, -0.01, 0.031))
start_button = bpy.context.active_object
start_button.name = "StartButton"
start_button.scale = (0.008, 0.004, 0.002)
start_button.data.materials.append(dark_gray_mat)
start_button.parent = controller_body

# Create Select button
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.008, -0.01, 0.031))
select_button = bpy.context.active_object
select_button.name = "SelectButton"
select_button.scale = (0.008, 0.004, 0.002)
select_button.data.materials.append(dark_gray_mat)
select_button.parent = controller_body

# Create cable connector on left side
bpy.ops.mesh.primitive_cylinder_add(radius=0.008, depth=0.015, location=(-0.06, 0, 0.005))
cable_connector = bpy.context.active_object
cable_connector.name = "CableConnector"
cable_connector.rotation_euler = (0, math.radians(90), 0)
cable_connector.data.materials.append(dark_gray_mat)
cable_connector.parent = controller_body

# Add beveled edges to controller body using modifier
bevel_modifier = controller_body.modifiers.new(name="Bevel", type='BEVEL')
bevel_modifier.width = 0.003
bevel_modifier.segments = 3

# Create controller logo area (recessed rectangle)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0.025, 0.02, 0.031))
logo_area = bpy.context.active_object
logo_area.name = "LogoArea"
logo_area.scale = (0.025, 0.008, 0.001)
logo_area.data.materials.append(red_mat)
logo_area.parent = controller_body

# Add smooth shading to cylindrical objects
for obj in [dpad_center, a_button, b_button, cable_connector]:
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()

# Select all controller parts for final view
bpy.ops.object.select_all(action='DESELECT')
controller_body.select_set(True)
bpy.context.view_layer.objects.active = controller_body

# Position camera for better view
bpy.ops.object.camera_add(location=(0.2, -0.15, 0.1))
camera = bpy.context.active_object
camera.rotation_euler = (math.radians(65), 0, math.radians(50))

# Set camera as active
bpy.context.scene.camera = camera

print("NES Controller generated successfully!")
