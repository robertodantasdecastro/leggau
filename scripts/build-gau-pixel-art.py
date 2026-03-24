#!/usr/bin/env python3
from __future__ import annotations

import colorsys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "mobile/Assets/Art/Characters/Gau/Exports/Gau-preview.png"
OUTPUT_DIR = ROOT / "mobile/Assets/Art/Characters/Gau/PixelArt"
OUTPUT = OUTPUT_DIR / "Gau-pixel-art.png"


def is_subject(pixel: tuple[int, int, int, int], background_rgb: tuple[int, int, int]) -> bool:
    r, g, b, a = pixel
    if a == 0:
        return False

    br, bg, bb = background_rgb
    distance = abs(r - br) + abs(g - bg) + abs(b - bb)
    h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
    return distance > 45 and (s > 0.12 or v < 0.78)


def mask_and_crop(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    background_rgb = rgba.getpixel((0, 0))[:3]

    mask = Image.new("L", rgba.size, 0)
    pixels = rgba.load()
    mask_pixels = mask.load()

    min_x, min_y = rgba.width, rgba.height
    max_x, max_y = 0, 0

    for y in range(rgba.height):
        for x in range(rgba.width):
            if is_subject(pixels[x, y], background_rgb):
                mask_pixels[x, y] = 255
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if max_x <= min_x or max_y <= min_y:
        raise RuntimeError("Could not isolate Gau silhouette from preview.")

    cropped = rgba.crop((min_x, min_y, max_x + 1, max_y + 1))
    cropped_mask = mask.crop((min_x, min_y, max_x + 1, max_y + 1))
    cropped.putalpha(cropped_mask)
    return cropped


def fit_on_canvas(image: Image.Image, canvas_size: int = 40, padding: int = 1) -> Image.Image:
    sprite = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    max_size = canvas_size - padding * 2
    ratio = min(max_size / image.width, max_size / image.height)
    resized = image.resize(
        (max(1, int(image.width * ratio)), max(1, int(image.height * ratio))),
        Image.Resampling.LANCZOS,
    )
    x = (canvas_size - resized.width) // 2
    y = canvas_size - padding - resized.height
    sprite.alpha_composite(resized, (x, y))
    return sprite


def quantize_sprite(image: Image.Image) -> Image.Image:
    small = image.resize((40, 40), Image.Resampling.BOX)
    alpha = small.getchannel("A")
    rgb = Image.new("RGB", small.size, (0, 0, 0))
    rgb.paste(small.convert("RGB"), mask=alpha)
    quantized = rgb.quantize(colors=16, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    rgba = quantized.convert("RGBA")
    rgba.putalpha(alpha.point(lambda value: 255 if value > 40 else 0))
    large = rgba.resize((800, 800), Image.Resampling.NEAREST)
    return large


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE)
    cropped = mask_and_crop(source)
    fitted = fit_on_canvas(cropped)
    pixel_art = quantize_sprite(fitted)
    pixel_art.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    main()
