import os
import sys

import bpy


def argv_after_double_dash():
    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--") + 1 :]


def ensure_directory(path):
    os.makedirs(path, exist_ok=True)


def save_image(image, filepath):
    image.filepath_raw = filepath
    image.file_format = "PNG"
    image.save()


def rgba(hex_value):
    hex_value = hex_value.lstrip("#")
    return tuple(int(hex_value[index : index + 2], 16) / 255.0 for index in (0, 2, 4)) + (1.0,)


def build_pixel_atlas(filepath):
    size = 32
    image = bpy.data.images.new("GauPixelAtlas", width=size, height=size, alpha=True)
    pixels = [(0.0, 0.0, 0.0, 0.0)] * (size * size)

    tile_colors = {
        (0, 0): (rgba("#4BA0E5"), rgba("#76B8F0"), rgba("#347EBA")),
        (1, 0): (rgba("#6CC3FF"), rgba("#A7D8FF"), rgba("#4B9BD1")),
        (2, 0): (rgba("#7EE1B5"), rgba("#A6F0D1"), rgba("#53B98A")),
        (3, 0): (rgba("#F5C54F"), rgba("#FFD978"), rgba("#D89A1E")),
        (0, 1): (rgba("#F08A3C"), rgba("#FFAB6E"), rgba("#CA6122")),
        (1, 1): (rgba("#F8F6EE"), rgba("#FFFFFF"), rgba("#D8D5CF")),
        (2, 1): (rgba("#1E2633"), rgba("#414C5C"), rgba("#090D14")),
        (3, 1): (rgba("#BCD8F0"), rgba("#D8E8F7"), rgba("#8FAFCC")),
    }

    tile_size = 8
    for tile_y in range(4):
        for tile_x in range(4):
            colors = tile_colors.get((tile_x, tile_y), (rgba("#000000"), rgba("#000000"), rgba("#000000")))
            for local_y in range(tile_size):
                for local_x in range(tile_size):
                    if (local_x + local_y) % 5 == 0:
                        color = colors[1]
                    elif (local_x - local_y) % 4 == 0:
                        color = colors[2]
                    else:
                        color = colors[0]
                    x = tile_x * tile_size + local_x
                    y = tile_y * tile_size + local_y
                    pixels[(y * size) + x] = color

    flat = [channel for pixel in pixels for channel in pixel]
    image.pixels = flat
    save_image(image, filepath)
    return image


def smart_project(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)
    bpy.ops.object.mode_set(mode="OBJECT")


def create_pixel_material(name, image, tile_x, tile_y):
    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()

    tex_coord = nodes.new(type="ShaderNodeTexCoord")
    mapping = nodes.new(type="ShaderNodeMapping")
    image_texture = nodes.new(type="ShaderNodeTexImage")
    principled = nodes.new(type="ShaderNodeBsdfPrincipled")
    output = nodes.new(type="ShaderNodeOutputMaterial")

    tex_coord.location = (-700, 0)
    mapping.location = (-500, 0)
    image_texture.location = (-260, 0)
    principled.location = (0, 0)
    output.location = (240, 0)

    image_texture.image = image
    image_texture.interpolation = "Closest"

    tile_size = 0.25
    mapping.inputs["Scale"].default_value[0] = tile_size
    mapping.inputs["Scale"].default_value[1] = tile_size
    mapping.inputs["Location"].default_value[0] = tile_x * tile_size
    mapping.inputs["Location"].default_value[1] = tile_y * tile_size

    principled.inputs["Roughness"].default_value = 1.0
    principled.inputs["Specular IOR Level"].default_value = 0.0

    links.new(tex_coord.outputs["UV"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], image_texture.inputs["Vector"])
    links.new(image_texture.outputs["Color"], principled.inputs["Base Color"])
    links.new(principled.outputs["BSDF"], output.inputs["Surface"])

    return material


def material_for_object(name, materials):
    if any(token in name for token in ("EyeWhite",)):
        return materials["eye_white"]
    if any(token in name for token in ("Pupil", "Brow")):
        return materials["eye_dark"]
    if any(token in name for token in ("Belly", "Chest")):
        return materials["belly"]
    if any(token in name for token in ("BeakTop", "Leg", "Foot", "Toe")):
        return materials["gold"]
    if any(token in name for token in ("Cheek", "Tuft", "Tail", "BeakBottom")):
        return materials["orange"]
    if any(token in name for token in ("Head",)):
        return materials["body_highlight"]
    return materials["body"]


def assign_pixel_materials(atlas_image):
    materials = {
        "body": create_pixel_material("GauPixelBody", atlas_image, 0, 0),
        "body_highlight": create_pixel_material("GauPixelHead", atlas_image, 1, 0),
        "belly": create_pixel_material("GauPixelBelly", atlas_image, 2, 0),
        "gold": create_pixel_material("GauPixelGold", atlas_image, 3, 0),
        "orange": create_pixel_material("GauPixelOrange", atlas_image, 0, 1),
        "eye_white": create_pixel_material("GauPixelEyeWhite", atlas_image, 1, 1),
        "eye_dark": create_pixel_material("GauPixelEyeDark", atlas_image, 2, 1),
    }

    for obj in bpy.data.objects:
        if obj.type != "MESH" or obj.name.startswith("PreviewFloor"):
            continue

        smart_project(obj)
        obj.data.materials.clear()
        obj.data.materials.append(material_for_object(obj.name, materials))

        for modifier in obj.modifiers:
            if modifier.type == "SUBSURF":
                modifier.levels = 1
                modifier.render_levels = 1


def save_export_and_render(output_dir):
    blend_path = os.path.join(output_dir, "Gau-pixel-textured.blend")
    fbx_path = os.path.join(output_dir, "Gau-pixel-textured.fbx")
    preview_path = os.path.join(output_dir, "Gau-pixel-textured-preview.png")

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
    source_blend = os.path.join(gau_root, "Source", "Gau.blend")
    output_dir = os.path.join(gau_root, "PixelTextured")
    atlas_path = os.path.join(output_dir, "Gau-pixel-texture.png")

    ensure_directory(output_dir)
    bpy.ops.wm.open_mainfile(filepath=source_blend)

    atlas_image = build_pixel_atlas(atlas_path)
    assign_pixel_materials(atlas_image)
    save_export_and_render(output_dir)


if __name__ == "__main__":
    main()
