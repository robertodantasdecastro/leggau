import math
import os
import sys

import bpy


def argv_after_double_dash():
    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--") + 1 :]


def ensure_directory(path):
    os.makedirs(path, exist_ok=True)


def rgba(hex_value):
    hex_value = hex_value.lstrip("#")
    return tuple(int(hex_value[index : index + 2], 16) / 255.0 for index in (0, 2, 4)) + (1.0,)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.outliner.orphans_purge(do_recursive=True)


def save_image(image, filepath):
    image.filepath_raw = filepath
    image.file_format = "PNG"
    image.save()


def create_pixel_atlas(filepath):
    size = 32
    tile_size = 8
    image = bpy.data.images.new("GauRoundedPixelAtlas", width=size, height=size, alpha=True)
    pixels = [(0.0, 0.0, 0.0, 1.0)] * (size * size)

    tile_colors = {
        (0, 0): (rgba("#4CA7F4"), rgba("#8ED1FF"), rgba("#2E71B1")),
        (1, 0): (rgba("#73BEF7"), rgba("#B2E3FF"), rgba("#4F96D2")),
        (2, 0): (rgba("#7DDBB2"), rgba("#BEF5DD"), rgba("#4E9E78")),
        (3, 0): (rgba("#F3C861"), rgba("#FFE49A"), rgba("#C98F2A")),
        (0, 1): (rgba("#F58F49"), rgba("#FFBB85"), rgba("#D16A25")),
        (1, 1): (rgba("#F7F3EC"), rgba("#FFFFFF"), rgba("#D4C8B8")),
        (2, 1): (rgba("#1F2530"), rgba("#59657A"), rgba("#0B1018")),
        (3, 1): (rgba("#E6D2A3"), rgba("#F7E8C2"), rgba("#C19C62")),
    }

    for tile_y in range(4):
        for tile_x in range(4):
            colors = tile_colors.get((tile_x, tile_y), (rgba("#000000"), rgba("#111111"), rgba("#222222")))
            for local_y in range(tile_size):
                for local_x in range(tile_size):
                    if local_x in {0, tile_size - 1} or local_y in {0, tile_size - 1}:
                        color = colors[2]
                    elif (local_x + local_y) % 5 == 0:
                        color = colors[1]
                    elif local_x == local_y or local_x == tile_size - local_y - 1:
                        color = colors[1]
                    else:
                        color = colors[0]
                    x = tile_x * tile_size + local_x
                    y = tile_y * tile_size + local_y
                    pixels[(y * size) + x] = color

    image.pixels = [channel for pixel in pixels for channel in pixel]
    save_image(image, filepath)
    return image


def create_pixel_material(name, image, tile_x, tile_y):
    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()

    tex_coord = nodes.new(type="ShaderNodeTexCoord")
    mapping = nodes.new(type="ShaderNodeMapping")
    image_texture = nodes.new(type="ShaderNodeTexImage")
    shader = nodes.new(type="ShaderNodeBsdfPrincipled")
    output = nodes.new(type="ShaderNodeOutputMaterial")

    tex_coord.location = (-700, 0)
    mapping.location = (-500, 0)
    image_texture.location = (-250, 0)
    shader.location = (10, 0)
    output.location = (230, 0)

    image_texture.image = image
    image_texture.interpolation = "Closest"

    tile_size = 0.25
    mapping.inputs["Scale"].default_value[0] = tile_size
    mapping.inputs["Scale"].default_value[1] = tile_size
    mapping.inputs["Location"].default_value[0] = tile_x * tile_size
    mapping.inputs["Location"].default_value[1] = tile_y * tile_size

    shader.inputs["Roughness"].default_value = 0.95
    shader.inputs["Specular IOR Level"].default_value = 0.0

    links.new(tex_coord.outputs["UV"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], image_texture.inputs["Vector"])
    links.new(image_texture.outputs["Color"], shader.inputs["Base Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material


def create_rounded_block(name, location, scale, rotation=(0.0, 0.0, 0.0), bevel=0.04, segments=5):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.shade_smooth()
    modifier = obj.modifiers.new(name="Bevel", type="BEVEL")
    modifier.width = bevel
    modifier.segments = segments
    return obj


def bind_to_bone(obj, armature, bone_name):
    obj.parent = armature
    modifier = obj.modifiers.new(name="Armature", type="ARMATURE")
    modifier.object = armature
    group = obj.vertex_groups.new(name=bone_name)
    group.add([vertex.index for vertex in obj.data.vertices], 1.0, "REPLACE")


def create_armature():
    bpy.ops.object.armature_add(enter_editmode=True, location=(0.0, 0.0, 0.0))
    armature = bpy.context.active_object
    armature.name = "GauArmature"
    armature.data.name = "GauArmatureData"
    edit_bones = armature.data.edit_bones

    root = edit_bones[0]
    root.name = "Root"
    root.head = (0.0, 0.0, 0.0)
    root.tail = (0.0, 0.0, 0.72)

    spine = edit_bones.new("Spine")
    spine.parent = root
    spine.head = (0.0, 0.0, 0.72)
    spine.tail = (0.0, 0.0, 1.72)

    neck = edit_bones.new("Neck")
    neck.parent = spine
    neck.head = (0.0, 0.0, 1.66)
    neck.tail = (0.0, 0.0, 2.0)

    head = edit_bones.new("Head")
    head.parent = neck
    head.head = (0.0, 0.0, 1.98)
    head.tail = (0.0, 0.0, 2.38)

    wing_left = edit_bones.new("Wing.L")
    wing_left.parent = spine
    wing_left.head = (0.68, 0.0, 1.35)
    wing_left.tail = (1.1, 0.0, 1.2)

    wing_right = edit_bones.new("Wing.R")
    wing_right.parent = spine
    wing_right.head = (-0.68, 0.0, 1.35)
    wing_right.tail = (-1.1, 0.0, 1.2)

    leg_left = edit_bones.new("Leg.L")
    leg_left.parent = root
    leg_left.head = (0.28, 0.0, 0.7)
    leg_left.tail = (0.28, 0.0, 0.03)

    leg_right = edit_bones.new("Leg.R")
    leg_right.parent = root
    leg_right.head = (-0.28, 0.0, 0.7)
    leg_right.tail = (-0.28, 0.0, 0.03)

    bpy.ops.object.mode_set(mode="OBJECT")
    return armature


def build_materials(atlas_image):
    return {
        "body": create_pixel_material("GauRoundedBody", atlas_image, 0, 0),
        "body_light": create_pixel_material("GauRoundedBodyLight", atlas_image, 1, 0),
        "belly": create_pixel_material("GauRoundedBelly", atlas_image, 2, 0),
        "gold": create_pixel_material("GauRoundedGold", atlas_image, 3, 0),
        "orange": create_pixel_material("GauRoundedOrange", atlas_image, 0, 1),
        "white": create_pixel_material("GauRoundedWhite", atlas_image, 1, 1),
        "dark": create_pixel_material("GauRoundedDark", atlas_image, 2, 1),
        "feet": create_pixel_material("GauRoundedFeet", atlas_image, 3, 1),
    }


def build_character(armature, materials):
    body = create_rounded_block("GauBodyRounded", location=(0.0, 0.02, 1.14), scale=(0.56, 0.46, 0.78), bevel=0.08, segments=6)
    body.data.materials.append(materials["body"])
    bind_to_bone(body, armature, "Spine")

    belly = create_rounded_block("GauBellyRounded", location=(0.0, -0.34, 1.05), scale=(0.28, 0.1, 0.44), bevel=0.04, segments=5)
    belly.data.materials.append(materials["belly"])
    bind_to_bone(belly, armature, "Spine")

    chest = create_rounded_block("GauChestRounded", location=(0.0, -0.31, 1.5), scale=(0.22, 0.08, 0.14), bevel=0.03, segments=5)
    chest.data.materials.append(materials["belly"])
    bind_to_bone(chest, armature, "Spine")

    head = create_rounded_block("GauHeadRounded", location=(0.0, -0.04, 2.06), scale=(0.48, 0.42, 0.4), bevel=0.07, segments=6)
    head.data.materials.append(materials["body_light"])
    bind_to_bone(head, armature, "Head")

    cheek_left = create_rounded_block("GauCheekLRounded", location=(0.24, -0.32, 1.92), scale=(0.09, 0.05, 0.08), rotation=(0.0, 0.0, math.radians(14.0)), bevel=0.02, segments=4)
    cheek_left.data.materials.append(materials["orange"])
    bind_to_bone(cheek_left, armature, "Head")

    cheek_right = create_rounded_block("GauCheekRRounded", location=(-0.24, -0.32, 1.92), scale=(0.09, 0.05, 0.08), rotation=(0.0, 0.0, math.radians(-14.0)), bevel=0.02, segments=4)
    cheek_right.data.materials.append(materials["orange"])
    bind_to_bone(cheek_right, armature, "Head")

    beak_top = create_rounded_block("GauBeakTopRounded", location=(0.0, -0.48, 1.95), scale=(0.16, 0.12, 0.1), rotation=(math.radians(12.0), 0.0, 0.0), bevel=0.03, segments=5)
    beak_top.data.materials.append(materials["gold"])
    bind_to_bone(beak_top, armature, "Head")

    beak_bottom = create_rounded_block("GauBeakBottomRounded", location=(0.0, -0.45, 1.84), scale=(0.1, 0.08, 0.06), rotation=(math.radians(-8.0), 0.0, 0.0), bevel=0.02, segments=4)
    beak_bottom.data.materials.append(materials["orange"])
    bind_to_bone(beak_bottom, armature, "Head")

    for side, x_value in (("L", 0.21), ("R", -0.21)):
        eye = create_rounded_block(f"GauEyeWhite{side}Rounded", location=(x_value, -0.44, 2.11), scale=(0.09, 0.03, 0.11), bevel=0.02, segments=4)
        eye.data.materials.append(materials["white"])
        bind_to_bone(eye, armature, "Head")

        pupil = create_rounded_block(f"GauPupil{side}Rounded", location=(x_value, -0.47, 2.1), scale=(0.038, 0.016, 0.046), bevel=0.01, segments=3)
        pupil.data.materials.append(materials["dark"])
        bind_to_bone(pupil, armature, "Head")

    brow_left = create_rounded_block("GauBrowLRounded", location=(0.22, -0.37, 2.29), scale=(0.09, 0.02, 0.03), rotation=(0.0, 0.0, math.radians(12.0)), bevel=0.01, segments=3)
    brow_left.data.materials.append(materials["dark"])
    bind_to_bone(brow_left, armature, "Head")

    brow_right = create_rounded_block("GauBrowRRounded", location=(-0.22, -0.37, 2.29), scale=(0.09, 0.02, 0.03), rotation=(0.0, 0.0, math.radians(-12.0)), bevel=0.01, segments=3)
    brow_right.data.materials.append(materials["dark"])
    bind_to_bone(brow_right, armature, "Head")

    tuft_center = create_rounded_block("GauTuftCenterRounded", location=(0.0, -0.01, 2.52), scale=(0.06, 0.06, 0.12), bevel=0.015, segments=4)
    tuft_center.data.materials.append(materials["orange"])
    bind_to_bone(tuft_center, armature, "Head")

    tuft_left = create_rounded_block("GauTuftLRounded", location=(0.09, -0.01, 2.5), scale=(0.045, 0.045, 0.085), rotation=(0.0, math.radians(8.0), math.radians(16.0)), bevel=0.012, segments=4)
    tuft_left.data.materials.append(materials["orange"])
    bind_to_bone(tuft_left, armature, "Head")

    tuft_right = create_rounded_block("GauTuftRRounded", location=(-0.09, -0.01, 2.5), scale=(0.045, 0.045, 0.085), rotation=(0.0, math.radians(-8.0), math.radians(-16.0)), bevel=0.012, segments=4)
    tuft_right.data.materials.append(materials["orange"])
    bind_to_bone(tuft_right, armature, "Head")

    wing_left = create_rounded_block("GauWingLRounded", location=(0.86, -0.02, 1.34), scale=(0.14, 0.09, 0.28), rotation=(0.0, math.radians(-10.0), math.radians(15.0)), bevel=0.03, segments=5)
    wing_left.data.materials.append(materials["body_light"])
    bind_to_bone(wing_left, armature, "Wing.L")

    wing_right = create_rounded_block("GauWingRRounded", location=(-0.86, -0.02, 1.34), scale=(0.14, 0.09, 0.28), rotation=(0.0, math.radians(10.0), math.radians(-15.0)), bevel=0.03, segments=5)
    wing_right.data.materials.append(materials["body_light"])
    bind_to_bone(wing_right, armature, "Wing.R")

    tail = create_rounded_block("GauTailRounded", location=(0.0, 0.42, 1.02), scale=(0.14, 0.1, 0.18), rotation=(math.radians(-12.0), 0.0, 0.0), bevel=0.03, segments=4)
    tail.data.materials.append(materials["body"])
    bind_to_bone(tail, armature, "Spine")

    leg_left = create_rounded_block("GauLegLRounded", location=(0.28, 0.0, 0.36), scale=(0.08, 0.08, 0.32), bevel=0.02, segments=4)
    leg_left.data.materials.append(materials["gold"])
    bind_to_bone(leg_left, armature, "Leg.L")

    leg_right = create_rounded_block("GauLegRRounded", location=(-0.28, 0.0, 0.36), scale=(0.08, 0.08, 0.32), bevel=0.02, segments=4)
    leg_right.data.materials.append(materials["gold"])
    bind_to_bone(leg_right, armature, "Leg.R")

    foot_left = create_rounded_block("GauFootLRounded", location=(0.28, -0.08, 0.05), scale=(0.2, 0.22, 0.055), bevel=0.02, segments=4)
    foot_left.data.materials.append(materials["feet"])
    bind_to_bone(foot_left, armature, "Leg.L")

    foot_right = create_rounded_block("GauFootRRounded", location=(-0.28, -0.08, 0.05), scale=(0.2, 0.22, 0.055), bevel=0.02, segments=4)
    foot_right.data.materials.append(materials["feet"])
    bind_to_bone(foot_right, armature, "Leg.R")


def create_action(armature, name, frame_end, pose_builder):
    action = bpy.data.actions.new(name=name)
    armature.animation_data_create()
    armature.animation_data.action = action

    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.select_all(action="SELECT")
    bpy.ops.pose.transforms_clear()

    for frame in sorted(pose_builder.keys()):
        bpy.context.scene.frame_set(frame)
        pose_builder[frame](armature.pose.bones)
        for bone in armature.pose.bones:
            bone.keyframe_insert(data_path="location", frame=frame)
            bone.keyframe_insert(data_path="rotation_euler", frame=frame)
            bone.keyframe_insert(data_path="scale", frame=frame)

    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.context.scene.frame_end = frame_end
    return action


def build_actions(armature):
    def idle_pose(bones):
        bones["Spine"].rotation_euler = (math.radians(2.0), 0.0, 0.0)
        bones["Head"].rotation_euler = (math.radians(-3.0), 0.0, math.radians(2.0))
        bones["Wing.L"].rotation_euler = (0.0, math.radians(-10.0), math.radians(6.0))
        bones["Wing.R"].rotation_euler = (0.0, math.radians(10.0), math.radians(-6.0))

    def idle_pose_alt(bones):
        bones["Spine"].rotation_euler = (math.radians(-2.0), 0.0, 0.0)
        bones["Head"].rotation_euler = (math.radians(3.0), 0.0, math.radians(-2.0))
        bones["Wing.L"].rotation_euler = (0.0, math.radians(-6.0), math.radians(10.0))
        bones["Wing.R"].rotation_euler = (0.0, math.radians(6.0), math.radians(-10.0))

    def celebrate_pose_a(bones):
        bones["Spine"].rotation_euler = (math.radians(-6.0), 0.0, 0.0)
        bones["Head"].rotation_euler = (math.radians(10.0), 0.0, 0.0)
        bones["Wing.L"].rotation_euler = (0.0, math.radians(-30.0), math.radians(42.0))
        bones["Wing.R"].rotation_euler = (0.0, math.radians(30.0), math.radians(-42.0))

    def celebrate_pose_b(bones):
        bones["Spine"].rotation_euler = (math.radians(7.0), 0.0, 0.0)
        bones["Head"].rotation_euler = (math.radians(-8.0), 0.0, 0.0)
        bones["Wing.L"].rotation_euler = (0.0, math.radians(-14.0), math.radians(16.0))
        bones["Wing.R"].rotation_euler = (0.0, math.radians(14.0), math.radians(-16.0))

    def prompt_pose_a(bones):
        bones["Head"].rotation_euler = (0.0, 0.0, math.radians(14.0))
        bones["Wing.L"].rotation_euler = (0.0, math.radians(-14.0), math.radians(22.0))
        bones["Wing.R"].rotation_euler = (0.0, math.radians(4.0), math.radians(-3.0))

    def prompt_pose_b(bones):
        bones["Head"].rotation_euler = (0.0, 0.0, math.radians(-10.0))
        bones["Wing.L"].rotation_euler = (0.0, math.radians(-4.0), math.radians(6.0))
        bones["Wing.R"].rotation_euler = (0.0, math.radians(14.0), math.radians(-22.0))

    create_action(
        armature,
        "GauRoundedPixel_Idle",
        24,
        {
            1: idle_pose,
            12: idle_pose_alt,
            24: idle_pose,
        },
    )
    create_action(
        armature,
        "GauRoundedPixel_Celebrate",
        28,
        {
            1: celebrate_pose_a,
            14: celebrate_pose_b,
            28: celebrate_pose_a,
        },
    )
    create_action(
        armature,
        "GauRoundedPixel_Prompt",
        24,
        {
            1: prompt_pose_a,
            12: prompt_pose_b,
            24: prompt_pose_a,
        },
    )
    armature.animation_data.action = bpy.data.actions["GauRoundedPixel_Idle"]


def setup_preview_scene():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.view_settings.view_transform = "Standard"

    world = bpy.data.worlds.new("GauRoundedPixelWorld")
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes["Background"]
    background.inputs["Color"].default_value = (0.78, 0.8, 0.84, 1.0)
    background.inputs["Strength"].default_value = 0.38

    bpy.ops.mesh.primitive_plane_add(location=(0.0, 0.0, -0.02), size=6.0)
    floor = bpy.context.active_object
    floor.name = "PreviewFloor"
    floor_mat = bpy.data.materials.new(name="PreviewFloorMaterial")
    floor_mat.use_nodes = True
    shader = floor_mat.node_tree.nodes["Principled BSDF"]
    shader.inputs["Base Color"].default_value = (0.95, 0.95, 0.96, 1.0)
    shader.inputs["Roughness"].default_value = 1.0
    floor.data.materials.append(floor_mat)

    bpy.ops.object.light_add(type="SUN", location=(2.6, -2.2, 4.8))
    sun = bpy.context.active_object
    sun.data.energy = 1.4
    sun.rotation_euler = (math.radians(38.0), 0.0, math.radians(34.0))

    bpy.ops.object.light_add(type="AREA", location=(-2.0, -3.2, 2.6))
    area = bpy.context.active_object
    area.data.energy = 1600
    area.data.shape = "RECTANGLE"
    area.data.size = 4.5
    area.data.size_y = 4.5
    area.rotation_euler = (math.radians(62.0), 0.0, math.radians(-25.0))

    bpy.ops.object.camera_add(location=(0.38, -6.0, 2.48), rotation=(math.radians(74.0), 0.0, math.radians(3.0)))
    camera = bpy.context.active_object
    camera.data.lens = 55
    scene.camera = camera


def save_export_and_render(output_dir):
    blend_path = os.path.join(output_dir, "Gau-rounded-pixel.blend")
    fbx_path = os.path.join(output_dir, "Gau-rounded-pixel.fbx")
    preview_path = os.path.join(output_dir, "Gau-rounded-pixel-preview.png")

    bpy.ops.wm.save_as_mainfile(filepath=blend_path)

    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.data.objects:
        if obj.type in {"ARMATURE", "MESH"} and obj.name != "PreviewFloor":
            obj.select_set(True)

    bpy.context.view_layer.objects.active = bpy.data.objects["GauArmature"]
    bpy.ops.export_scene.fbx(
        filepath=fbx_path,
        use_selection=True,
        object_types={"ARMATURE", "MESH"},
        apply_scale_options="FBX_SCALE_ALL",
        bake_anim=True,
        bake_anim_use_all_actions=True,
        bake_anim_use_nla_strips=False,
        bake_anim_use_all_bones=True,
        add_leaf_bones=False,
        path_mode="AUTO",
    )

    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.scene.render.filepath = preview_path
    bpy.ops.render.render(write_still=True)


def main():
    args = argv_after_double_dash()
    if not args:
        raise SystemExit("Expected Gau root path after --")

    gau_root = os.path.abspath(args[0])
    output_dir = os.path.join(gau_root, "RoundedPixel")
    atlas_path = os.path.join(output_dir, "Gau-rounded-pixel-texture.png")

    ensure_directory(output_dir)
    clear_scene()
    atlas_image = create_pixel_atlas(atlas_path)
    materials = build_materials(atlas_image)
    armature = create_armature()
    build_character(armature, materials)
    build_actions(armature)
    setup_preview_scene()
    save_export_and_render(output_dir)


if __name__ == "__main__":
    main()
