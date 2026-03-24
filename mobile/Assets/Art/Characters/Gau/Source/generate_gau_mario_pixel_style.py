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


def create_retro_tile(pixels, size, tile_x, tile_y, tile_size, colors, pattern):
    base, highlight, shadow = colors
    start_x = tile_x * tile_size
    start_y = tile_y * tile_size

    for local_y in range(tile_size):
        for local_x in range(tile_size):
            edge = local_x < 3 or local_y < 3 or local_x >= tile_size - 3 or local_y >= tile_size - 3
            center_x = tile_size / 2
            center_y = tile_size / 2
            circleish = ((local_x - center_x) ** 2 + (local_y - center_y) ** 2) < (tile_size * 0.28) ** 2
            checker = (local_x // 4 + local_y // 4) % 2 == 0
            sparkle = ((local_x * 3) + local_y) % 17 == 0

            color = base
            if edge:
                color = shadow
            elif pattern == "soft":
                if checker:
                    color = highlight
                elif sparkle:
                    color = shadow
            elif pattern == "stripe":
                if local_x % 8 in {0, 1, 2}:
                    color = highlight
                elif local_x % 11 in {0, 1}:
                    color = shadow
            elif pattern == "belly":
                if circleish or checker:
                    color = highlight
                elif local_y > tile_size * 0.7:
                    color = shadow
            elif pattern == "metal":
                if local_y % 8 in {0, 1, 2}:
                    color = highlight
                elif checker:
                    color = shadow
            elif pattern == "cheek":
                if sparkle or checker:
                    color = highlight
                elif local_x < tile_size * 0.25:
                    color = shadow
            elif pattern == "eye":
                if checker:
                    color = highlight
                elif sparkle:
                    color = shadow

            x = start_x + local_x
            y = start_y + local_y
            pixels[(y * size) + x] = color


def create_pixel_atlas(filepath):
    size = 256
    tile_size = 64
    image = bpy.data.images.new("GauMarioPixelAtlas", width=size, height=size, alpha=True)
    pixels = [(0.0, 0.0, 0.0, 1.0)] * (size * size)

    tiles = {
        (0, 0): ((rgba("#41A2F2"), rgba("#9DDBFF"), rgba("#225E98")), "soft"),
        (1, 0): ((rgba("#6EC3FF"), rgba("#D0EFFF"), rgba("#3E88C0")), "stripe"),
        (2, 0): ((rgba("#74D8AE"), rgba("#C6F7E0"), rgba("#46956E")), "belly"),
        (3, 0): ((rgba("#F2C552"), rgba("#FFEBA7"), rgba("#C98717")), "metal"),
        (0, 1): ((rgba("#F18D43"), rgba("#FFC38C"), rgba("#CA601D")), "cheek"),
        (1, 1): ((rgba("#F6F2EA"), rgba("#FFFFFF"), rgba("#D4C9BB")), "soft"),
        (2, 1): ((rgba("#1D2430"), rgba("#65748E"), rgba("#060A10")), "eye"),
        (3, 1): ((rgba("#2B80D0"), rgba("#78C2FF"), rgba("#15518A")), "stripe"),
        (0, 2): ((rgba("#CDEBFF"), rgba("#F1FAFF"), rgba("#87B7DC")), "soft"),
        (1, 2): ((rgba("#E3D1A1"), rgba("#FAECC7"), rgba("#BB9754")), "metal"),
    }

    for (tile_x, tile_y), (colors, pattern) in tiles.items():
        create_retro_tile(pixels, size, tile_x, tile_y, tile_size, colors, pattern)

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
    output.location = (240, 0)

    image_texture.image = image
    image_texture.interpolation = "Closest"

    tile_scale = 0.25
    mapping.inputs["Scale"].default_value[0] = tile_scale
    mapping.inputs["Scale"].default_value[1] = tile_scale
    mapping.inputs["Location"].default_value[0] = tile_x * tile_scale
    mapping.inputs["Location"].default_value[1] = tile_y * tile_scale

    shader.inputs["Roughness"].default_value = 0.94
    shader.inputs["Specular IOR Level"].default_value = 0.0

    links.new(tex_coord.outputs["UV"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], image_texture.inputs["Vector"])
    links.new(image_texture.outputs["Color"], shader.inputs["Base Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material


def create_rounded_block(name, location, scale, rotation=(0.0, 0.0, 0.0), bevel=0.05, segments=6):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.shade_smooth()
    modifier = obj.modifiers.new(name="Bevel", type="BEVEL")
    modifier.width = bevel
    modifier.segments = segments
    modifier.profile = 0.85
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
        "body": create_pixel_material("GauMarioBody", atlas_image, 0, 0),
        "head": create_pixel_material("GauMarioHead", atlas_image, 1, 0),
        "belly": create_pixel_material("GauMarioBelly", atlas_image, 2, 0),
        "gold": create_pixel_material("GauMarioGold", atlas_image, 3, 0),
        "orange": create_pixel_material("GauMarioOrange", atlas_image, 0, 1),
        "white": create_pixel_material("GauMarioWhite", atlas_image, 1, 1),
        "dark": create_pixel_material("GauMarioDark", atlas_image, 2, 1),
        "wing": create_pixel_material("GauMarioWing", atlas_image, 3, 1),
        "body_detail": create_pixel_material("GauMarioBodyDetail", atlas_image, 0, 2),
        "feet": create_pixel_material("GauMarioFeet", atlas_image, 1, 2),
    }


def build_character(armature, materials):
    body = create_rounded_block("GauBodyMario", location=(0.0, 0.02, 1.14), scale=(0.56, 0.46, 0.78), bevel=0.1, segments=8)
    body.data.materials.append(materials["body"])
    bind_to_bone(body, armature, "Spine")

    belly = create_rounded_block("GauBellyMario", location=(0.0, -0.34, 1.05), scale=(0.29, 0.1, 0.45), bevel=0.05, segments=6)
    belly.data.materials.append(materials["belly"])
    bind_to_bone(belly, armature, "Spine")

    chest = create_rounded_block("GauChestMario", location=(0.0, -0.31, 1.5), scale=(0.23, 0.085, 0.15), bevel=0.04, segments=6)
    chest.data.materials.append(materials["body_detail"])
    bind_to_bone(chest, armature, "Spine")

    head = create_rounded_block("GauHeadMario", location=(0.0, -0.04, 2.06), scale=(0.49, 0.43, 0.41), bevel=0.09, segments=8)
    head.data.materials.append(materials["head"])
    bind_to_bone(head, armature, "Head")

    cheek_left = create_rounded_block("GauCheekLMario", location=(0.25, -0.32, 1.92), scale=(0.095, 0.055, 0.085), rotation=(0.0, 0.0, math.radians(14.0)), bevel=0.025, segments=5)
    cheek_left.data.materials.append(materials["orange"])
    bind_to_bone(cheek_left, armature, "Head")

    cheek_right = create_rounded_block("GauCheekRMario", location=(-0.25, -0.32, 1.92), scale=(0.095, 0.055, 0.085), rotation=(0.0, 0.0, math.radians(-14.0)), bevel=0.025, segments=5)
    cheek_right.data.materials.append(materials["orange"])
    bind_to_bone(cheek_right, armature, "Head")

    beak_top = create_rounded_block("GauBeakTopMario", location=(0.0, -0.485, 1.95), scale=(0.165, 0.125, 0.105), rotation=(math.radians(12.0), 0.0, 0.0), bevel=0.035, segments=6)
    beak_top.data.materials.append(materials["gold"])
    bind_to_bone(beak_top, armature, "Head")

    beak_bottom = create_rounded_block("GauBeakBottomMario", location=(0.0, -0.45, 1.84), scale=(0.105, 0.085, 0.062), rotation=(math.radians(-8.0), 0.0, 0.0), bevel=0.024, segments=5)
    beak_bottom.data.materials.append(materials["orange"])
    bind_to_bone(beak_bottom, armature, "Head")

    for side, x_value in (("L", 0.21), ("R", -0.21)):
        eye = create_rounded_block(f"GauEyeWhite{side}Mario", location=(x_value, -0.445, 2.11), scale=(0.095, 0.032, 0.115), bevel=0.022, segments=5)
        eye.data.materials.append(materials["white"])
        bind_to_bone(eye, armature, "Head")

        pupil = create_rounded_block(f"GauPupil{side}Mario", location=(x_value, -0.472, 2.1), scale=(0.04, 0.017, 0.05), bevel=0.012, segments=4)
        pupil.data.materials.append(materials["dark"])
        bind_to_bone(pupil, armature, "Head")

    brow_left = create_rounded_block("GauBrowLMario", location=(0.22, -0.37, 2.29), scale=(0.09, 0.02, 0.03), rotation=(0.0, 0.0, math.radians(12.0)), bevel=0.01, segments=3)
    brow_left.data.materials.append(materials["dark"])
    bind_to_bone(brow_left, armature, "Head")

    brow_right = create_rounded_block("GauBrowRMario", location=(-0.22, -0.37, 2.29), scale=(0.09, 0.02, 0.03), rotation=(0.0, 0.0, math.radians(-12.0)), bevel=0.01, segments=3)
    brow_right.data.materials.append(materials["dark"])
    bind_to_bone(brow_right, armature, "Head")

    tuft_center = create_rounded_block("GauTuftCenterMario", location=(0.0, -0.01, 2.52), scale=(0.06, 0.06, 0.12), bevel=0.015, segments=4)
    tuft_center.data.materials.append(materials["gold"])
    bind_to_bone(tuft_center, armature, "Head")

    tuft_left = create_rounded_block("GauTuftLMario", location=(0.09, -0.01, 2.5), scale=(0.045, 0.045, 0.085), rotation=(0.0, math.radians(8.0), math.radians(16.0)), bevel=0.012, segments=4)
    tuft_left.data.materials.append(materials["gold"])
    bind_to_bone(tuft_left, armature, "Head")

    tuft_right = create_rounded_block("GauTuftRMario", location=(-0.09, -0.01, 2.5), scale=(0.045, 0.045, 0.085), rotation=(0.0, math.radians(-8.0), math.radians(-16.0)), bevel=0.012, segments=4)
    tuft_right.data.materials.append(materials["gold"])
    bind_to_bone(tuft_right, armature, "Head")

    wing_left = create_rounded_block("GauWingLMario", location=(0.86, -0.02, 1.34), scale=(0.14, 0.095, 0.3), rotation=(0.0, math.radians(-10.0), math.radians(15.0)), bevel=0.04, segments=6)
    wing_left.data.materials.append(materials["wing"])
    bind_to_bone(wing_left, armature, "Wing.L")

    wing_right = create_rounded_block("GauWingRMario", location=(-0.86, -0.02, 1.34), scale=(0.14, 0.095, 0.3), rotation=(0.0, math.radians(10.0), math.radians(-15.0)), bevel=0.04, segments=6)
    wing_right.data.materials.append(materials["wing"])
    bind_to_bone(wing_right, armature, "Wing.R")

    tail = create_rounded_block("GauTailMario", location=(0.0, 0.42, 1.02), scale=(0.15, 0.1, 0.19), rotation=(math.radians(-12.0), 0.0, 0.0), bevel=0.04, segments=5)
    tail.data.materials.append(materials["body_detail"])
    bind_to_bone(tail, armature, "Spine")

    leg_left = create_rounded_block("GauLegLMario", location=(0.28, 0.0, 0.36), scale=(0.08, 0.08, 0.32), bevel=0.02, segments=4)
    leg_left.data.materials.append(materials["gold"])
    bind_to_bone(leg_left, armature, "Leg.L")

    leg_right = create_rounded_block("GauLegRMario", location=(-0.28, 0.0, 0.36), scale=(0.08, 0.08, 0.32), bevel=0.02, segments=4)
    leg_right.data.materials.append(materials["gold"])
    bind_to_bone(leg_right, armature, "Leg.R")

    foot_left = create_rounded_block("GauFootLMario", location=(0.28, -0.08, 0.05), scale=(0.2, 0.22, 0.06), bevel=0.026, segments=5)
    foot_left.data.materials.append(materials["feet"])
    bind_to_bone(foot_left, armature, "Leg.L")

    foot_right = create_rounded_block("GauFootRMario", location=(-0.28, -0.08, 0.05), scale=(0.2, 0.22, 0.06), bevel=0.026, segments=5)
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

    create_action(armature, "GauMarioPixel_Idle", 24, {1: idle_pose, 12: idle_pose_alt, 24: idle_pose})
    create_action(armature, "GauMarioPixel_Celebrate", 28, {1: celebrate_pose_a, 14: celebrate_pose_b, 28: celebrate_pose_a})
    create_action(armature, "GauMarioPixel_Prompt", 24, {1: prompt_pose_a, 12: prompt_pose_b, 24: prompt_pose_a})
    armature.animation_data.action = bpy.data.actions["GauMarioPixel_Idle"]


def setup_preview_scene():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.view_settings.view_transform = "Standard"

    world = bpy.data.worlds.new("GauMarioPixelWorld")
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes["Background"]
    background.inputs["Color"].default_value = (0.7, 0.73, 0.79, 1.0)
    background.inputs["Strength"].default_value = 0.34

    bpy.ops.mesh.primitive_plane_add(location=(0.0, 0.0, -0.02), size=6.0)
    floor = bpy.context.active_object
    floor.name = "PreviewFloor"
    floor_mat = bpy.data.materials.new(name="PreviewFloorMaterial")
    floor_mat.use_nodes = True
    shader = floor_mat.node_tree.nodes["Principled BSDF"]
    shader.inputs["Base Color"].default_value = (0.95, 0.95, 0.96, 1.0)
    shader.inputs["Roughness"].default_value = 1.0
    floor.data.materials.append(floor_mat)

    bpy.ops.object.light_add(type="SUN", location=(2.4, -2.2, 4.5))
    sun = bpy.context.active_object
    sun.data.energy = 1.2
    sun.rotation_euler = (math.radians(38.0), 0.0, math.radians(32.0))

    bpy.ops.object.light_add(type="AREA", location=(-2.0, -3.2, 2.6))
    area = bpy.context.active_object
    area.data.energy = 1500
    area.data.shape = "RECTANGLE"
    area.data.size = 4.5
    area.data.size_y = 4.5
    area.rotation_euler = (math.radians(62.0), 0.0, math.radians(-25.0))

    bpy.ops.object.camera_add(location=(0.45, -6.0, 2.5), rotation=(math.radians(74.0), 0.0, math.radians(4.0)))
    camera = bpy.context.active_object
    camera.data.lens = 55
    scene.camera = camera


def save_export_and_render(output_dir):
    blend_path = os.path.join(output_dir, "Gau-mario-pixel.blend")
    fbx_path = os.path.join(output_dir, "Gau-mario-pixel.fbx")
    preview_path = os.path.join(output_dir, "Gau-mario-pixel-preview.png")

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
    bpy.context.scene.frame_set(12)
    bpy.context.scene.render.filepath = preview_path
    bpy.ops.render.render(write_still=True)


def main():
    args = argv_after_double_dash()
    if not args:
        raise SystemExit("Expected Gau root path after --")

    gau_root = os.path.abspath(args[0])
    output_dir = os.path.join(gau_root, "MarioPixel")
    atlas_path = os.path.join(output_dir, "Gau-mario-pixel-texture.png")

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
