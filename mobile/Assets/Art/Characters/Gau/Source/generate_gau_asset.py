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


def create_material(name, rgba, roughness=0.6):
    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    shader = material.node_tree.nodes["Principled BSDF"]
    shader.inputs["Base Color"].default_value = rgba
    shader.inputs["Roughness"].default_value = roughness
    return material


def create_mesh(name, primitive_fn, location, rotation=(0.0, 0.0, 0.0), scale=(1.0, 1.0, 1.0)):
    primitive_fn(location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.shade_smooth()
    return obj


def create_armature():
    bpy.ops.object.armature_add(enter_editmode=True, location=(0.0, 0.0, 0.0))
    armature = bpy.context.active_object
    armature.name = "GauArmature"
    armature.data.name = "GauArmatureData"

    edit_bones = armature.data.edit_bones
    root = edit_bones[0]
    root.name = "Root"
    root.head = (0.0, 0.0, 0.0)
    root.tail = (0.0, 0.0, 0.45)

    spine = edit_bones.new("Spine")
    spine.parent = root
    spine.head = (0.0, 0.0, 0.45)
    spine.tail = (0.0, 0.0, 1.2)

    neck = edit_bones.new("Neck")
    neck.parent = spine
    neck.head = (0.0, 0.0, 1.15)
    neck.tail = (0.0, 0.0, 1.55)

    head = edit_bones.new("Head")
    head.parent = neck
    head.head = (0.0, 0.0, 1.55)
    head.tail = (0.0, 0.0, 1.9)

    wing_left = edit_bones.new("Wing.L")
    wing_left.parent = spine
    wing_left.head = (0.45, 0.0, 1.05)
    wing_left.tail = (0.95, 0.0, 0.95)

    wing_right = edit_bones.new("Wing.R")
    wing_right.parent = spine
    wing_right.head = (-0.45, 0.0, 1.05)
    wing_right.tail = (-0.95, 0.0, 0.95)

    leg_left = edit_bones.new("Leg.L")
    leg_left.parent = root
    leg_left.head = (0.18, 0.0, 0.45)
    leg_left.tail = (0.18, 0.0, 0.0)

    leg_right = edit_bones.new("Leg.R")
    leg_right.parent = root
    leg_right.head = (-0.18, 0.0, 0.45)
    leg_right.tail = (-0.18, 0.0, 0.0)

    bpy.ops.object.mode_set(mode="OBJECT")
    return armature


def bind_to_bone(obj, armature, bone_name):
    obj.parent = armature
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name
    obj.matrix_parent_inverse = armature.matrix_world.inverted()


def build_character(armature):
    body_material = create_material("GauBody", (0.117, 0.564, 1.0, 1.0), roughness=0.62)
    accent_material = create_material("GauAccent", (1.0, 0.549, 0.258, 1.0), roughness=0.48)
    beak_material = create_material("GauBeak", (1.0, 0.776, 0.302, 1.0), roughness=0.42)
    eye_material = create_material("GauEyes", (0.11, 0.12, 0.16, 1.0), roughness=0.25)
    feet_material = create_material("GauFeet", (0.988, 0.694, 0.235, 1.0), roughness=0.55)

    body = create_mesh(
        "GauBodyMesh",
        lambda **kwargs: bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=10, **kwargs),
        location=(0.0, 0.0, 0.95),
        scale=(0.62, 0.48, 0.72),
    )
    body.data.materials.append(body_material)
    bind_to_bone(body, armature, "Spine")

    belly = create_mesh(
        "GauBellyMesh",
        lambda **kwargs: bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, **kwargs),
        location=(0.0, -0.16, 0.8),
        scale=(0.34, 0.18, 0.4),
    )
    belly.data.materials.append(accent_material)
    bind_to_bone(belly, armature, "Spine")

    head = create_mesh(
        "GauHeadMesh",
        lambda **kwargs: bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=9, **kwargs),
        location=(0.0, 0.03, 1.57),
        scale=(0.42, 0.4, 0.38),
    )
    head.data.materials.append(body_material)
    bind_to_bone(head, armature, "Head")

    beak = create_mesh(
        "GauBeakMesh",
        lambda **kwargs: bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=0.12, radius2=0.01, depth=0.28, **kwargs),
        location=(0.0, -0.33, 1.5),
        rotation=(math.radians(90.0), 0.0, 0.0),
    )
    beak.data.materials.append(beak_material)
    bind_to_bone(beak, armature, "Head")

    for suffix, x_value in (("L", 0.14), ("R", -0.14)):
        eye = create_mesh(
            f"GauEye{suffix}",
            lambda **kwargs: bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6, **kwargs),
            location=(x_value, -0.24, 1.6),
            scale=(0.05, 0.04, 0.05),
        )
        eye.data.materials.append(eye_material)
        bind_to_bone(eye, armature, "Head")

    wing_left = create_mesh(
        "GauWingLeft",
        lambda **kwargs: bpy.ops.mesh.primitive_cube_add(**kwargs),
        location=(0.72, 0.02, 1.0),
        rotation=(0.0, math.radians(18.0), math.radians(25.0)),
        scale=(0.16, 0.06, 0.38),
    )
    wing_left.data.materials.append(accent_material)
    bind_to_bone(wing_left, armature, "Wing.L")

    wing_right = create_mesh(
        "GauWingRight",
        lambda **kwargs: bpy.ops.mesh.primitive_cube_add(**kwargs),
        location=(-0.72, 0.02, 1.0),
        rotation=(0.0, math.radians(-18.0), math.radians(-25.0)),
        scale=(0.16, 0.06, 0.38),
    )
    wing_right.data.materials.append(accent_material)
    bind_to_bone(wing_right, armature, "Wing.R")

    for suffix, x_value in (("L", 0.18), ("R", -0.18)):
        leg = create_mesh(
            f"GauLeg{suffix}",
            lambda **kwargs: bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.04, depth=0.42, **kwargs),
            location=(x_value, 0.0, 0.18),
        )
        leg.data.materials.append(feet_material)
        bind_to_bone(leg, armature, f"Leg.{suffix}")

        foot = create_mesh(
            f"GauFoot{suffix}",
            lambda **kwargs: bpy.ops.mesh.primitive_cube_add(**kwargs),
            location=(x_value, -0.1, -0.02),
            scale=(0.15, 0.2, 0.03),
        )
        foot.data.materials.append(feet_material)
        bind_to_bone(foot, armature, f"Leg.{suffix}")


def key_pose(pose_bones, frame, root_z=0.0, spine_x=0.0, head_z=0.0, head_x=0.0, wing_left_z=0.0, wing_right_z=0.0):
    root = pose_bones["Root"]
    root.location = (0.0, 0.0, root_z)
    root.keyframe_insert(data_path="location", frame=frame)

    spine = pose_bones["Spine"]
    spine.rotation_mode = "XYZ"
    spine.rotation_euler = (spine_x, 0.0, 0.0)
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
    return action


def animate_character(armature):
    create_action(
        armature,
        "Gau_Idle",
        [
            {"frame": 1, "root_z": 0.0, "spine_x": math.radians(-2.0), "head_x": math.radians(2.5), "head_z": math.radians(-2.0), "wing_left_z": math.radians(14.0), "wing_right_z": math.radians(-14.0)},
            {"frame": 16, "root_z": 0.07, "spine_x": math.radians(1.5), "head_x": math.radians(-1.0), "head_z": math.radians(3.0), "wing_left_z": math.radians(8.0), "wing_right_z": math.radians(-8.0)},
            {"frame": 32, "root_z": 0.0, "spine_x": math.radians(-2.0), "head_x": math.radians(2.5), "head_z": math.radians(-2.0), "wing_left_z": math.radians(14.0), "wing_right_z": math.radians(-14.0)},
        ],
        32,
    )

    create_action(
        armature,
        "Gau_Celebrate",
        [
            {"frame": 1, "root_z": 0.0, "spine_x": math.radians(-3.0), "head_x": math.radians(6.0), "head_z": 0.0, "wing_left_z": math.radians(16.0), "wing_right_z": math.radians(-16.0)},
            {"frame": 8, "root_z": 0.2, "spine_x": math.radians(4.0), "head_x": math.radians(-10.0), "head_z": math.radians(-6.0), "wing_left_z": math.radians(65.0), "wing_right_z": math.radians(-65.0)},
            {"frame": 16, "root_z": 0.05, "spine_x": math.radians(-1.0), "head_x": math.radians(8.0), "head_z": math.radians(6.0), "wing_left_z": math.radians(32.0), "wing_right_z": math.radians(-32.0)},
            {"frame": 24, "root_z": 0.18, "spine_x": math.radians(5.0), "head_x": math.radians(-8.0), "head_z": math.radians(-8.0), "wing_left_z": math.radians(72.0), "wing_right_z": math.radians(-72.0)},
            {"frame": 32, "root_z": 0.0, "spine_x": math.radians(-3.0), "head_x": math.radians(6.0), "head_z": 0.0, "wing_left_z": math.radians(16.0), "wing_right_z": math.radians(-16.0)},
        ],
        32,
    )

    create_action(
        armature,
        "Gau_Prompt",
        [
            {"frame": 1, "root_z": 0.0, "spine_x": 0.0, "head_x": math.radians(2.0), "head_z": math.radians(-10.0), "wing_left_z": math.radians(20.0), "wing_right_z": math.radians(-8.0)},
            {"frame": 12, "root_z": 0.03, "spine_x": math.radians(2.0), "head_x": math.radians(-4.0), "head_z": math.radians(10.0), "wing_left_z": math.radians(10.0), "wing_right_z": math.radians(-20.0)},
            {"frame": 24, "root_z": 0.0, "spine_x": 0.0, "head_x": math.radians(2.0), "head_z": math.radians(-10.0), "wing_left_z": math.radians(20.0), "wing_right_z": math.radians(-8.0)},
        ],
        24,
    )


def save_blend_and_export(root_directory):
    source_directory = os.path.join(root_directory, "Source")
    export_directory = os.path.join(root_directory, "Exports")
    ensure_directory(source_directory)
    ensure_directory(export_directory)

    blend_path = os.path.join(source_directory, "Gau.blend")
    fbx_path = os.path.join(export_directory, "Gau.fbx")

    bpy.ops.wm.save_as_mainfile(filepath=blend_path)

    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.data.objects:
        if obj.type in {"ARMATURE", "MESH"}:
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
    save_blend_and_export(asset_root)


if __name__ == "__main__":
    main()
