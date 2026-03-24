import math
import os
import sys

import bpy


def argv_after_double_dash():
    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--") + 1 :]


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.outliner.orphans_purge(do_recursive=True)


def ensure_directory(path):
    os.makedirs(path, exist_ok=True)


def create_material(name, rgba, roughness=0.55, metallic=0.0):
    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    shader = material.node_tree.nodes["Principled BSDF"]
    shader.inputs["Base Color"].default_value = rgba
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    return material


def apply_subdivision(obj, levels=2):
    modifier = obj.modifiers.new(name="Subdivision", type="SUBSURF")
    modifier.levels = levels
    modifier.render_levels = levels


def apply_bevel(obj, width=0.015, segments=3):
    modifier = obj.modifiers.new(name="Bevel", type="BEVEL")
    modifier.width = width
    modifier.segments = segments


def create_mesh(name, primitive_fn, location, rotation=(0.0, 0.0, 0.0), scale=(1.0, 1.0, 1.0), smooth=True):
    primitive_fn(location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if smooth:
        bpy.ops.object.shade_smooth()
    return obj


def create_uv_sphere(name, location, scale, segments=24, rings=12):
    obj = create_mesh(
        name,
        lambda **kwargs: bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, **kwargs),
        location=location,
        scale=scale,
    )
    apply_subdivision(obj)
    return obj


def create_cube(name, location, rotation, scale):
    obj = create_mesh(
        name,
        lambda **kwargs: bpy.ops.mesh.primitive_cube_add(**kwargs),
        location=location,
        rotation=rotation,
        scale=scale,
    )
    apply_bevel(obj)
    apply_subdivision(obj, levels=1)
    return obj


def create_cone(name, location, rotation, radius1, radius2, depth):
    obj = create_mesh(
        name,
        lambda **kwargs: bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=radius1, radius2=radius2, depth=depth, **kwargs),
        location=location,
        rotation=rotation,
        scale=(1.0, 1.0, 1.0),
    )
    apply_bevel(obj, width=0.01, segments=2)
    return obj


def bind_to_bone(obj, armature, bone_name):
    obj.parent = armature
    armature_modifier = obj.modifiers.new(name="Armature", type="ARMATURE")
    armature_modifier.object = armature
    vertex_group = obj.vertex_groups.new(name=bone_name)
    vertex_group.add([vertex.index for vertex in obj.data.vertices], 1.0, "REPLACE")


def create_armature():
    bpy.ops.object.armature_add(enter_editmode=True, location=(0.0, 0.0, 0.0))
    armature = bpy.context.active_object
    armature.name = "GauArmature"
    armature.data.name = "GauArmatureData"

    edit_bones = armature.data.edit_bones
    root = edit_bones[0]
    root.name = "Root"
    root.head = (0.0, 0.0, 0.0)
    root.tail = (0.0, 0.0, 0.55)

    spine = edit_bones.new("Spine")
    spine.parent = root
    spine.head = (0.0, 0.0, 0.55)
    spine.tail = (0.0, 0.0, 1.35)

    neck = edit_bones.new("Neck")
    neck.parent = spine
    neck.head = (0.0, 0.0, 1.3)
    neck.tail = (0.0, 0.0, 1.72)

    head = edit_bones.new("Head")
    head.parent = neck
    head.head = (0.0, 0.0, 1.68)
    head.tail = (0.0, 0.0, 2.08)

    wing_left = edit_bones.new("Wing.L")
    wing_left.parent = spine
    wing_left.head = (0.46, -0.03, 1.1)
    wing_left.tail = (0.92, 0.0, 0.98)

    wing_right = edit_bones.new("Wing.R")
    wing_right.parent = spine
    wing_right.head = (-0.46, -0.03, 1.1)
    wing_right.tail = (-0.92, 0.0, 0.98)

    leg_left = edit_bones.new("Leg.L")
    leg_left.parent = root
    leg_left.head = (0.19, 0.0, 0.52)
    leg_left.tail = (0.19, 0.0, 0.03)

    leg_right = edit_bones.new("Leg.R")
    leg_right.parent = root
    leg_right.head = (-0.19, 0.0, 0.52)
    leg_right.tail = (-0.19, 0.0, 0.03)

    bpy.ops.object.mode_set(mode="OBJECT")
    return armature


def create_toe_group(prefix, x_value, y_base, z_value, material, armature, bone_name):
    offsets = (-0.085, 0.0, 0.085)
    rotations = (0.36, 0.0, -0.36)
    for index, (offset, rotation) in enumerate(zip(offsets, rotations), start=1):
        toe = create_cube(
            f"{prefix}Toe{index}",
            location=(x_value + offset, y_base, z_value),
            rotation=(math.radians(6.0), 0.0, rotation),
            scale=(0.06, 0.16, 0.03),
        )
        toe.data.materials.append(material)
        bind_to_bone(toe, armature, bone_name)


def build_character(armature):
    body_material = create_material("GauBody", (0.08, 0.49, 0.96, 1.0), roughness=0.62)
    belly_material = create_material("GauBelly", (0.259, 0.824, 0.573, 1.0), roughness=0.56)
    beak_material = create_material("GauBeak", (1.0, 0.776, 0.302, 1.0), roughness=0.44)
    accent_material = create_material("GauAccent", (1.0, 0.549, 0.258, 1.0), roughness=0.45)
    eye_white_material = create_material("GauEyeWhite", (0.98, 0.99, 1.0, 1.0), roughness=0.25)
    eye_pupil_material = create_material("GauEyePupil", (0.11, 0.12, 0.16, 1.0), roughness=0.2)
    feet_material = create_material("GauFeet", (0.988, 0.694, 0.235, 1.0), roughness=0.5)

    body = create_uv_sphere("GauBody", location=(0.0, 0.03, 1.0), scale=(0.68, 0.54, 0.9))
    body.data.materials.append(body_material)
    bind_to_bone(body, armature, "Spine")

    hips = create_uv_sphere("GauHips", location=(0.0, 0.14, 0.68), scale=(0.44, 0.34, 0.38))
    hips.data.materials.append(body_material)
    bind_to_bone(hips, armature, "Spine")

    belly = create_uv_sphere("GauBelly", location=(0.0, -0.22, 0.94), scale=(0.36, 0.2, 0.56))
    belly.data.materials.append(belly_material)
    bind_to_bone(belly, armature, "Spine")

    chest = create_uv_sphere("GauChest", location=(0.0, -0.16, 1.19), scale=(0.3, 0.17, 0.28))
    chest.data.materials.append(belly_material)
    bind_to_bone(chest, armature, "Spine")

    head = create_uv_sphere("GauHead", location=(0.0, -0.07, 1.65), scale=(0.54, 0.48, 0.46))
    head.data.materials.append(body_material)
    bind_to_bone(head, armature, "Head")

    cheek_left = create_uv_sphere("GauCheekL", location=(0.28, -0.3, 1.53), scale=(0.12, 0.08, 0.1), segments=18, rings=10)
    cheek_left.data.materials.append(accent_material)
    bind_to_bone(cheek_left, armature, "Head")

    cheek_right = create_uv_sphere("GauCheekR", location=(-0.28, -0.3, 1.53), scale=(0.12, 0.08, 0.1), segments=18, rings=10)
    cheek_right.data.materials.append(accent_material)
    bind_to_bone(cheek_right, armature, "Head")

    beak_top = create_cone(
        "GauBeakTop",
        location=(0.0, -0.47, 1.52),
        rotation=(math.radians(90.0), 0.0, 0.0),
        radius1=0.19,
        radius2=0.04,
        depth=0.38,
    )
    beak_top.data.materials.append(beak_material)
    bind_to_bone(beak_top, armature, "Head")

    beak_bottom = create_cone(
        "GauBeakBottom",
        location=(0.0, -0.42, 1.39),
        rotation=(math.radians(102.0), 0.0, 0.0),
        radius1=0.13,
        radius2=0.03,
        depth=0.23,
    )
    beak_bottom.data.materials.append(accent_material)
    bind_to_bone(beak_bottom, armature, "Head")

    eye_left = create_uv_sphere("GauEyeWhiteL", location=(0.22, -0.44, 1.74), scale=(0.115, 0.055, 0.145), segments=18, rings=10)
    eye_left.data.materials.append(eye_white_material)
    bind_to_bone(eye_left, armature, "Head")

    eye_right = create_uv_sphere("GauEyeWhiteR", location=(-0.22, -0.44, 1.74), scale=(0.115, 0.055, 0.145), segments=18, rings=10)
    eye_right.data.materials.append(eye_white_material)
    bind_to_bone(eye_right, armature, "Head")

    pupil_left = create_uv_sphere("GauPupilL", location=(0.22, -0.49, 1.73), scale=(0.044, 0.022, 0.065), segments=12, rings=8)
    pupil_left.data.materials.append(eye_pupil_material)
    bind_to_bone(pupil_left, armature, "Head")

    pupil_right = create_uv_sphere("GauPupilR", location=(-0.22, -0.49, 1.73), scale=(0.044, 0.022, 0.065), segments=12, rings=8)
    pupil_right.data.materials.append(eye_pupil_material)
    bind_to_bone(pupil_right, armature, "Head")

    brow_left = create_cube(
        "GauBrowL",
        location=(0.2, -0.36, 1.93),
        rotation=(0.0, math.radians(6.0), math.radians(12.0)),
        scale=(0.1, 0.018, 0.03),
    )
    brow_left.data.materials.append(eye_pupil_material)
    bind_to_bone(brow_left, armature, "Head")

    brow_right = create_cube(
        "GauBrowR",
        location=(-0.2, -0.36, 1.93),
        rotation=(0.0, math.radians(-6.0), math.radians(-12.0)),
        scale=(0.1, 0.018, 0.03),
    )
    brow_right.data.materials.append(eye_pupil_material)
    bind_to_bone(brow_right, armature, "Head")

    tuft_center = create_cube(
        "GauTuftCenter",
        location=(0.0, -0.08, 2.02),
        rotation=(math.radians(-18.0), 0.0, 0.0),
        scale=(0.06, 0.07, 0.18),
    )
    tuft_center.data.materials.append(accent_material)
    bind_to_bone(tuft_center, armature, "Head")

    tuft_left = create_cube(
        "GauTuftLeft",
        location=(0.08, -0.07, 1.99),
        rotation=(math.radians(-10.0), 0.0, math.radians(18.0)),
        scale=(0.04, 0.05, 0.13),
    )
    tuft_left.data.materials.append(accent_material)
    bind_to_bone(tuft_left, armature, "Head")

    tuft_right = create_cube(
        "GauTuftRight",
        location=(-0.08, -0.07, 1.99),
        rotation=(math.radians(-10.0), 0.0, math.radians(-18.0)),
        scale=(0.04, 0.05, 0.13),
    )
    tuft_right.data.materials.append(accent_material)
    bind_to_bone(tuft_right, armature, "Head")

    wing_left = create_cube(
        "GauWingLeft",
        location=(0.5, -0.02, 1.06),
        rotation=(math.radians(10.0), math.radians(8.0), math.radians(12.0)),
        scale=(0.13, 0.085, 0.3),
    )
    wing_left.data.materials.append(body_material)
    bind_to_bone(wing_left, armature, "Wing.L")

    wing_right = create_cube(
        "GauWingRight",
        location=(-0.5, -0.02, 1.06),
        rotation=(math.radians(10.0), math.radians(-8.0), math.radians(-12.0)),
        scale=(0.13, 0.085, 0.3),
    )
    wing_right.data.materials.append(body_material)
    bind_to_bone(wing_right, armature, "Wing.R")

    tail = create_cube(
        "GauTail",
        location=(0.0, 0.44, 0.92),
        rotation=(math.radians(28.0), 0.0, 0.0),
        scale=(0.16, 0.06, 0.11),
    )
    tail.data.materials.append(accent_material)
    bind_to_bone(tail, armature, "Spine")

    for suffix, x_value in (("L", 0.18), ("R", -0.18)):
        leg = create_cube(
            f"GauLeg{suffix}",
            location=(x_value, -0.01, 0.2),
            rotation=(math.radians(3.0), 0.0, 0.0),
            scale=(0.055, 0.055, 0.22),
        )
        leg.data.materials.append(feet_material)
        bind_to_bone(leg, armature, f"Leg.{suffix}")

        foot = create_cube(
            f"GauFoot{suffix}",
            location=(x_value, -0.15, -0.04),
            rotation=(math.radians(8.0), 0.0, 0.0),
            scale=(0.14, 0.18, 0.035),
        )
        foot.data.materials.append(feet_material)
        bind_to_bone(foot, armature, f"Leg.{suffix}")

        create_toe_group(f"Gau{suffix}", x_value, -0.28, -0.07, feet_material, armature, f"Leg.{suffix}")


def key_pose(
    pose_bones,
    frame,
    root_z=0.0,
    root_x=0.0,
    spine_x=0.0,
    spine_z=0.0,
    head_z=0.0,
    head_x=0.0,
    wing_left_z=0.0,
    wing_right_z=0.0,
):
    root = pose_bones["Root"]
    root.location = (root_x, 0.0, root_z)
    root.keyframe_insert(data_path="location", frame=frame)

    spine = pose_bones["Spine"]
    spine.rotation_mode = "XYZ"
    spine.rotation_euler = (spine_x, 0.0, spine_z)
    spine.keyframe_insert(data_path="rotation_euler", frame=frame)

    head = pose_bones["Head"]
    head.rotation_mode = "XYZ"
    head.rotation_euler = (head_x, 0.0, head_z)
    head.keyframe_insert(data_path="rotation_euler", frame=frame)

    wing_left = pose_bones["Wing.L"]
    wing_left.rotation_mode = "XYZ"
    wing_left.rotation_euler = (0.0, 0.0, wing_left_z)
    wing_left.keyframe_insert(data_path="rotation_euler", frame=frame)

    wing_right = pose_bones["Wing.R"]
    wing_right.rotation_mode = "XYZ"
    wing_right.rotation_euler = (0.0, 0.0, wing_right_z)
    wing_right.keyframe_insert(data_path="rotation_euler", frame=frame)


def create_action(armature, name, poses, frame_end):
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode="POSE")
    if armature.animation_data is None:
        armature.animation_data_create()

    action = bpy.data.actions.new(name=name)
    action.use_fake_user = True
    armature.animation_data.action = action

    for pose in poses:
        key_pose(armature.pose.bones, **pose)

    bpy.context.object.animation_data.action = action
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = frame_end
    bpy.ops.object.mode_set(mode="OBJECT")


def animate_character(armature):
    create_action(
        armature,
        "Gau_Idle",
        [
            {"frame": 1, "root_z": 0.0, "spine_x": math.radians(-2.0), "spine_z": math.radians(-2.0), "head_x": math.radians(5.0), "head_z": math.radians(-4.0), "wing_left_z": math.radians(18.0), "wing_right_z": math.radians(-18.0)},
            {"frame": 14, "root_z": 0.05, "spine_x": math.radians(1.5), "spine_z": math.radians(2.0), "head_x": math.radians(-2.0), "head_z": math.radians(4.0), "wing_left_z": math.radians(10.0), "wing_right_z": math.radians(-10.0)},
            {"frame": 28, "root_z": 0.0, "spine_x": math.radians(-2.0), "spine_z": math.radians(-2.0), "head_x": math.radians(5.0), "head_z": math.radians(-4.0), "wing_left_z": math.radians(18.0), "wing_right_z": math.radians(-18.0)},
        ],
        28,
    )

    create_action(
        armature,
        "Gau_Celebrate",
        [
            {"frame": 1, "root_z": 0.0, "spine_x": math.radians(-2.0), "head_x": math.radians(7.0), "head_z": 0.0, "wing_left_z": math.radians(22.0), "wing_right_z": math.radians(-22.0)},
            {"frame": 8, "root_z": 0.18, "spine_x": math.radians(6.0), "head_x": math.radians(-10.0), "head_z": math.radians(-7.0), "wing_left_z": math.radians(78.0), "wing_right_z": math.radians(-78.0)},
            {"frame": 16, "root_z": 0.04, "spine_x": math.radians(-1.0), "head_x": math.radians(9.0), "head_z": math.radians(7.0), "wing_left_z": math.radians(34.0), "wing_right_z": math.radians(-34.0)},
            {"frame": 24, "root_z": 0.16, "spine_x": math.radians(5.0), "head_x": math.radians(-8.0), "head_z": math.radians(-6.0), "wing_left_z": math.radians(85.0), "wing_right_z": math.radians(-85.0)},
            {"frame": 32, "root_z": 0.0, "spine_x": math.radians(-2.0), "head_x": math.radians(7.0), "head_z": 0.0, "wing_left_z": math.radians(22.0), "wing_right_z": math.radians(-22.0)},
        ],
        32,
    )

    create_action(
        armature,
        "Gau_Prompt",
        [
            {"frame": 1, "root_z": 0.0, "root_x": -0.02, "spine_x": math.radians(1.0), "spine_z": math.radians(-3.0), "head_x": math.radians(4.0), "head_z": math.radians(-16.0), "wing_left_z": math.radians(22.0), "wing_right_z": math.radians(-8.0)},
            {"frame": 12, "root_z": 0.03, "root_x": 0.02, "spine_x": math.radians(3.0), "spine_z": math.radians(3.0), "head_x": math.radians(-4.0), "head_z": math.radians(16.0), "wing_left_z": math.radians(8.0), "wing_right_z": math.radians(-22.0)},
            {"frame": 24, "root_z": 0.0, "root_x": -0.02, "spine_x": math.radians(1.0), "spine_z": math.radians(-3.0), "head_x": math.radians(4.0), "head_z": math.radians(-16.0), "wing_left_z": math.radians(22.0), "wing_right_z": math.radians(-8.0)},
        ],
        24,
    )


def create_preview_setup():
    world = bpy.data.worlds["World"]
    world.use_nodes = True
    background = world.node_tree.nodes["Background"]
    background.inputs["Color"].default_value = (0.91, 0.94, 0.98, 1.0)
    background.inputs["Strength"].default_value = 0.45

    camera_data = bpy.data.cameras.new("PreviewCamera")
    camera = bpy.data.objects.new("PreviewCamera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (1.7, -6.1, 2.35)
    camera.rotation_euler = (math.radians(73.0), 0.0, math.radians(16.0))
    camera.data.lens = 56
    bpy.context.scene.camera = camera

    sun_data = bpy.data.lights.new(name="PreviewSun", type="SUN")
    sun_data.energy = 1.8
    sun = bpy.data.objects.new(name="PreviewSun", object_data=sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(42.0), math.radians(12.0), math.radians(-20.0))

    fill_data = bpy.data.lights.new(name="PreviewFill", type="AREA")
    fill_data.energy = 700
    fill_data.shape = "RECTANGLE"
    fill_data.size = 5.5
    fill_data.size_y = 5.5
    fill = bpy.data.objects.new(name="PreviewFill", object_data=fill_data)
    bpy.context.collection.objects.link(fill)
    fill.location = (-3.0, -3.9, 2.1)
    fill.rotation_euler = (math.radians(75.0), 0.0, math.radians(25.0))

    rim_data = bpy.data.lights.new(name="PreviewRim", type="AREA")
    rim_data.energy = 550
    rim_data.shape = "RECTANGLE"
    rim_data.size = 4.5
    rim_data.size_y = 3.0
    rim = bpy.data.objects.new(name="PreviewRim", object_data=rim_data)
    bpy.context.collection.objects.link(rim)
    rim.location = (3.8, 1.8, 2.4)
    rim.rotation_euler = (math.radians(105.0), 0.0, math.radians(125.0))

    floor = create_cube(
        "PreviewFloor",
        location=(0.0, 0.6, -0.24),
        rotation=(0.0, 0.0, 0.0),
        scale=(1.65, 1.65, 0.02),
    )
    floor_material = create_material("PreviewFloorMaterial", (0.98, 0.93, 0.83, 1.0), roughness=0.86)
    floor.data.materials.append(floor_material)

    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
    bpy.context.scene.eevee.taa_render_samples = 64
    bpy.context.scene.render.resolution_x = 1280
    bpy.context.scene.render.resolution_y = 1280
    bpy.context.scene.render.film_transparent = False


def set_presentation_pose(armature):
    if armature.animation_data is None:
        return

    action = bpy.data.actions.get("Gau_Prompt")
    if action is None:
        return

    armature.animation_data.action = action
    bpy.context.scene.frame_set(1)


def save_blend_export_and_preview(root_directory):
    source_directory = os.path.join(root_directory, "Source")
    export_directory = os.path.join(root_directory, "Exports")
    ensure_directory(source_directory)
    ensure_directory(export_directory)

    blend_path = os.path.join(source_directory, "Gau.blend")
    fbx_path = os.path.join(export_directory, "Gau.fbx")
    preview_path = os.path.join(export_directory, "Gau-preview.png")

    set_presentation_pose(bpy.data.objects["GauArmature"])
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
    return blend_path, fbx_path, preview_path


def main():
    args = argv_after_double_dash()
    if not args:
        raise SystemExit("Expected Gau asset root as argument after --")

    asset_root = os.path.abspath(args[0])
    clear_scene()

    bpy.context.scene.render.fps = 24
    bpy.context.scene.unit_settings.system = "METRIC"

    armature = create_armature()
    build_character(armature)
    animate_character(armature)
    create_preview_setup()
    save_blend_export_and_preview(asset_root)


if __name__ == "__main__":
    main()
