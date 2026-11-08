"""Regenerates the app icons in public/icons and src/app/favicon.ico. Requires: pip install pillow"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
BLUE = (43, 79, 215, 255)  # matches --primary in globals.css
WHITE = (255, 255, 255, 255)


def draw_icon(size: int, maskable: bool = False) -> Image.Image:
    scale = 4  # draw large, then downsample for smooth edges
    s = size * scale
    image = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    if maskable:
        draw.rectangle([0, 0, s, s], fill=BLUE)  # full bleed; the OS applies its own mask
        inset = s * 0.26
    else:
        draw.rounded_rectangle([0, 0, s - 1, s - 1], radius=s * 0.22, fill=BLUE)
        inset = s * 0.2
    # A white "picture" glyph: frame, sun and mountains.
    left, top, right, bottom = inset, inset + s * 0.04, s - inset, s - inset - s * 0.04
    stroke = s * 0.055
    draw.rounded_rectangle([left, top, right, bottom], radius=s * 0.07, outline=WHITE, width=round(stroke))
    w, h = right - left, bottom - top
    sun_r = w * 0.1
    cx, cy = left + w * 0.7, top + h * 0.3
    draw.ellipse([cx - sun_r, cy - sun_r, cx + sun_r, cy + sun_r], fill=WHITE)
    base = bottom - stroke * 0.5
    draw.polygon([(left + stroke * 0.5, base), (left + w * 0.38, top + h * 0.42), (left + w * 0.62, base)], fill=WHITE)
    draw.polygon([(left + w * 0.45, base), (left + w * 0.68, top + h * 0.58), (right - stroke * 0.5, base)], fill=WHITE)
    return image.resize((size, size), Image.LANCZOS)


icons = ROOT / "public" / "icons"
icons.mkdir(parents=True, exist_ok=True)
draw_icon(192).save(icons / "icon-192.png")
draw_icon(512).save(icons / "icon-512.png")
draw_icon(512, maskable=True).save(icons / "maskable-512.png")
draw_icon(180, maskable=True).convert("RGB").save(icons / "apple-touch-icon.png")
draw_icon(64).save(ROOT / "src" / "app" / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
