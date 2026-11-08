"""Regenerates the test images. Requires: pip install pillow pillow-heif"""
import random
from pathlib import Path

import pillow_heif
from PIL import Image, ImageDraw, PngImagePlugin

pillow_heif.register_heif_opener()
out = Path(__file__).parent


def gradient(width: int, height: int) -> Image.Image:
    image = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(image)
    for x in range(width):
        draw.line([(x, 0), (x, height)], fill=(int(255 * x / width), 120, 255 - int(255 * x / width)))
    draw.ellipse([width // 4, height // 4, width * 3 // 4, height * 3 // 4], fill=(250, 220, 40))
    return image


def gps_exif(orientation: int = 1) -> Image.Exif:
    exif = Image.Exif()
    exif[0x0112] = orientation  # Orientation
    exif[0x010F] = "TestCam"  # Make
    exif[0x0110] = "Model 1"  # Model
    exif[0x8825] = {1: "N", 2: (51.0, 30.0, 0.0), 3: "W", 4: (0.0, 7.0, 0.0)}  # GPS: London
    return exif


# 1200×900 HEIC, like an iPhone photo.
gradient(1200, 900).save(out / "photo.heic", quality=80)

# 800×600 JPG stored sideways: EXIF orientation 6 means it should display as 600×800.
gradient(800, 600).save(out / "rotated-gps.jpg", quality=85, exif=gps_exif(orientation=6))

# 400×300 images with a transparent left half.
transparent = gradient(400, 300).convert("RGBA")
transparent.paste((0, 0, 0, 0), (0, 0, 200, 300))
transparent.save(out / "transparent.webp", quality=90)
transparent.save(out / "transparent.png")
gradient(640, 480).save(out / "photo.jpg", quality=90)

# 1600×1200 detailed photo saved at high quality, so compression has something to remove.
random.seed(7)
detailed = gradient(1600, 1200)
draw = ImageDraw.Draw(detailed)
for _ in range(4000):
    x, y = random.randrange(1600), random.randrange(1200)
    r = random.randrange(2, 14)
    draw.ellipse([x, y, x + r, y + r], fill=tuple(random.randrange(256) for _ in range(3)))
detailed.save(out / "large-photo.jpg", quality=95)

# Upright photos full of metadata, for the EXIF remover and metadata viewer.
XMP = b'<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" dc:creator="Jane Doe"/></rdf:RDF></x:xmpmeta>'
meta = gps_exif(orientation=1)
meta[0x013B] = "Jane Doe"  # Artist
gradient(320, 240).save(out / "gps.jpg", quality=90, exif=meta, xmp=XMP, comment=b"secret comment")
with open(out / "gps.jpg", "ab") as handle:
    handle.write(b"TRAILING-PREVIEW-DATA")  # data after the end-of-image marker
text_info = PngImagePlugin.PngInfo()
text_info.add_text("Author", "Jane Doe")
text_info.add_text("Comment", "secret comment")
transparent.save(out / "gps.png", pnginfo=text_info, exif=meta)
gradient(320, 240).save(out / "gps.webp", quality=90, exif=meta, xmp=XMP)

# Already heavily compressed (quality 10, optimised) with GPS data: re-compressing can't make it smaller.
gradient(640, 480).save(out / "low-quality-gps.jpg", quality=10, optimize=True, exif=meta)

# A small transparent logo for the watermark tool.
logo = Image.new("RGBA", (200, 100), (0, 0, 0, 0))
ImageDraw.Draw(logo).rounded_rectangle([0, 0, 199, 99], radius=20, fill=(220, 30, 60, 255))
logo.save(out / "logo.png")

(out / "not-an-image.txt").write_text("This is not an image.\n")
