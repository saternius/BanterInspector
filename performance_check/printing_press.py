import bpy
import bmesh
import math

# Clear existing objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Create materials
def create_material(name, color, metallic=0.0, roughness=0.5):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    return mat

wood_mat = create_material("Wood", (0.4, 0.25, 0.15, 1.0), metallic=0.0, roughness=0.8)
dark_wood_mat = create_material("DarkWood", (0.2, 0.12, 0.08, 1.0), metallic=0.0, roughness=0.7)
metal_mat = create_material("Metal", (0.3, 0.3, 0.35, 1.0), metallic=0.9, roughness=0.3)
brass_mat = create_material("Brass", (0.8, 0.6, 0.2, 1.0), metallic=0.9, roughness=0.2)
iron_mat = create_material("Iron", (0.15, 0.15, 0.15, 1.0), metallic=0.8, roughness=0.4)

# Create base platform
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.05))
base = bpy.context.active_object
base.name = "Base"
base.scale = (1.2, 0.8, 0.1)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
base.data.materials.append(dark_wood_mat)

# Create four corner posts (vertical frame)
post_height = 2.0
post_positions = [
    (-0.5, -0.35, post_height/2 + 0.1, "PostFL"),  # Front-left
    (0.5, -0.35, post_height/2 + 0.1, "PostFR"),   # Front-right
    (-0.5, 0.35, post_height/2 + 0.1, "PostBL"),   # Back-left
    (0.5, 0.35, post_height/2 + 0.1, "PostBR")     # Back-right
]

for x, y, z, name in post_positions:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=post_height, location=(x, y, z))
    post = bpy.context.active_object
    post.name = name
    post.data.materials.append(wood_mat)
    post.parent = base
    bpy.ops.object.shade_smooth()

# Create top crossbeam
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, post_height + 0.15))
top_beam = bpy.context.active_object
top_beam.name = "TopBeam"
top_beam.scale = (1.3, 0.9, 0.12)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
top_beam.data.materials.append(dark_wood_mat)
top_beam.parent = base

# Create screw hole in top beam (using boolean)
bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.25, location=(0, 0, post_height + 0.15))
screw_hole = bpy.context.active_object
screw_hole.name = "ScrewHole"

# Create main screw mechanism
screw_length = 1.5
bpy.ops.mesh.primitive_cylinder_add(radius=0.065, depth=screw_length, location=(0, 0, post_height - 0.6))
main_screw = bpy.context.active_object
main_screw.name = "MainScrew"
main_screw.data.materials.append(metal_mat)
main_screw.parent = base
bpy.ops.object.shade_smooth()

# Add screw threads using array modifier (simplified representation)
bpy.ops.mesh.primitive_torus_add(major_radius=0.065, minor_radius=0.01, location=(0, 0, post_height + 0.05))
thread_ring = bpy.context.active_object
thread_ring.name = "ThreadPattern"
thread_ring.data.materials.append(metal_mat)
thread_ring.parent = main_screw

# Array modifier for thread rings
array_mod = thread_ring.modifiers.new(name="ThreadArray", type='ARRAY')
array_mod.count = 8
array_mod.relative_offset_displace = (0, 0, 0.5)
bpy.ops.object.shade_smooth()

# Create screw head/nut at top
bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.15, location=(0, 0, post_height + 0.1))
screw_head = bpy.context.active_object
screw_head.name = "ScrewHead"
screw_head.data.materials.append(brass_mat)
screw_head.parent = main_screw
bpy.ops.object.shade_smooth()

# Create handle/wheel for turning screw
bpy.ops.mesh.primitive_torus_add(major_radius=0.3, minor_radius=0.025, location=(0, 0, post_height + 0.1))
handle_wheel = bpy.context.active_object
handle_wheel.name = "HandleWheel"
handle_wheel.data.materials.append(iron_mat)
handle_wheel.parent = screw_head
bpy.ops.object.shade_smooth()

# Add handle spokes
spoke_angles = [0, 90, 180, 270]
for angle in spoke_angles:
    rad = math.radians(angle)
    x_pos = 0.15 * math.cos(rad)
    y_pos = 0.15 * math.sin(rad)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=0.3, location=(x_pos, y_pos, post_height + 0.1))
    spoke = bpy.context.active_object
    spoke.name = f"Spoke_{angle}"
    spoke.rotation_euler = (0, math.radians(90), rad)
    spoke.data.materials.append(iron_mat)
    spoke.parent = handle_wheel
    bpy.ops.object.shade_smooth()

# Create platen (pressing plate)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, post_height - 0.85))
platen = bpy.context.active_object
platen.name = "Platen"
platen.scale = (0.6, 0.5, 0.08)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
platen.data.materials.append(iron_mat)
platen.parent = main_screw

# Create bed (where paper/type sits)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.25))
bed = bpy.context.active_object
bed.name = "Bed"
bed.scale = (0.65, 0.55, 0.12)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bed.data.materials.append(wood_mat)
bed.parent = base

# Create sliding bed rails
for y_offset in [-0.4, 0.4]:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, y_offset, 0.18))
    rail = bpy.context.active_object
    rail.name = f"BedRail_{y_offset}"
    rail.scale = (0.9, 0.05, 0.03)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    rail.data.materials.append(metal_mat)
    rail.parent = base

# Create ink roller
bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.7, location=(-0.4, 0, 0.6))
ink_roller = bpy.context.active_object
ink_roller.name = "InkRoller"
ink_roller.rotation_euler = (0, math.radians(90), 0)
ink_roller.data.materials.append(iron_mat)
ink_roller.parent = base
bpy.ops.object.shade_smooth()

# Create roller support arms
for x_offset in [-0.5, -0.3]:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_offset, 0, 0.45))
    arm = bpy.context.active_object
    arm.name = f"RollerArm_{x_offset}"
    arm.scale = (0.04, 0.04, 0.3)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    arm.data.materials.append(metal_mat)
    arm.parent = base

# Create roller handles
for y_side in [-0.4, 0.4]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.025, depth=0.15, location=(-0.4, y_side, 0.6))
    handle = bpy.context.active_object
    handle.name = f"RollerHandle_{y_side}"
    handle.rotation_euler = (0, math.radians(90), 0)
    handle.data.materials.append(wood_mat)
    handle.parent = ink_roller
    bpy.ops.object.shade_smooth()

# Create decorative base feet
foot_positions = [(-0.55, -0.35, 0.02), (0.55, -0.35, 0.02), (-0.55, 0.35, 0.02), (0.55, 0.35, 0.02)]
for x, y, z in foot_positions:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, location=(x, y, z))
    foot = bpy.context.active_object
    foot.name = f"Foot_{x}_{y}"
    foot.scale = (1, 1, 0.6)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    foot.data.materials.append(brass_mat)
    foot.parent = base
    bpy.ops.object.shade_smooth()

# Add bracing between posts
brace_height = 0.8
brace_configs = [
    # Front and back horizontal braces
    ((-0.5, -0.35, brace_height), (0.5, -0.35, brace_height), "FrontBrace"),
    ((-0.5, 0.35, brace_height), (0.5, 0.35, brace_height), "BackBrace"),
    # Side horizontal braces
    ((-0.5, -0.35, brace_height), (-0.5, 0.35, brace_height), "LeftBrace"),
    ((0.5, -0.35, brace_height), (0.5, 0.35, brace_height), "RightBrace"),
]

for start, end, name in brace_configs:
    # Calculate length and midpoint
    length = math.sqrt((end[0]-start[0])**2 + (end[1]-start[1])**2 + (end[2]-start[2])**2)
    mid_x = (start[0] + end[0]) / 2
    mid_y = (start[1] + end[1]) / 2
    mid_z = (start[2] + end[2]) / 2

    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=length, location=(mid_x, mid_y, mid_z))
    brace = bpy.context.active_object
    brace.name = name

    # Calculate rotation
    if start[1] != end[1]:  # Y-axis aligned
        brace.rotation_euler = (math.radians(90), 0, 0)
    else:  # X-axis aligned
        brace.rotation_euler = (0, math.radians(90), 0)

    brace.data.materials.append(wood_mat)
    brace.parent = base
    bpy.ops.object.shade_smooth()

# Position camera for better view
bpy.ops.object.camera_add(location=(3, -3, 2))
camera = bpy.context.active_object
camera.rotation_euler = (math.radians(70), 0, math.radians(45))

# Set camera as active
bpy.context.scene.camera = camera

# Add lighting
bpy.ops.object.light_add(type='SUN', location=(2, -2, 5))
sun = bpy.context.active_object
sun.data.energy = 1.5

print("Printing Press generated successfully!")
print(f"Press height: {post_height + 0.2} units")
print("Components: Base, 4 posts, screw mechanism, platen, bed, ink roller")
