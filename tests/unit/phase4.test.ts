import { readFileSync } from "node:fs";
import path from "node:path";
import ExifReader from "exifreader";
import { describe, expect, it } from "vitest";
import { extractPalette, formatHsl, formatRgb, hexToRgb, isLight, rgbToHex, rgbToHsl } from "@/lib/image/color";
import { percentToPixels } from "@/lib/image/crop";
import { summarizeMetadata } from "@/lib/image/metadata";
import { stripJpeg, stripPng, stripWebp, UnsupportedStructureError } from "@/lib/image/strip-metadata";
import { rotatedSize } from "@/lib/image/transform";
import { anchorPoint, rotatedBounds, tileCenters } from "@/lib/image/watermark";

const fixture = (name: string) => new Uint8Array(readFileSync(path.join(__dirname, "..", "fixtures", name)));
const text = (bytes: Uint8Array) => Buffer.from(bytes).toString("latin1");
const tagsOf = (bytes: Uint8Array) =>
  ExifReader.load(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, { expanded: true });

describe("colour helpers", () => {
  it("converts between formats", () => {
    expect(rgbToHex({ r: 255, g: 128, b: 0 })).toBe("#FF8000");
    expect(hexToRgb("#ff8000")).toEqual({ r: 255, g: 128, b: 0 });
    expect(hexToRgb("nope")).toBeNull();
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    expect(formatHsl({ r: 0, g: 0, b: 255 })).toBe("hsl(240, 100%, 50%)");
    expect(formatRgb({ r: 1, g: 2, b: 3 })).toBe("rgb(1, 2, 3)");
    expect(rgbToHsl({ r: 128, g: 128, b: 128 })).toEqual({ h: 0, s: 0, l: 50 });
  });

  it("picks readable text colours", () => {
    expect(isLight({ r: 255, g: 255, b: 255 })).toBe(true);
    expect(isLight({ r: 20, g: 20, b: 60 })).toBe(false);
  });

  it("extracts the dominant colours, most common first", () => {
    const pixels: number[] = [];
    for (let i = 0; i < 75; i++) pixels.push(255, 0, 0, 255); // red ×75
    for (let i = 0; i < 25; i++) pixels.push(0, 0, 255, 255); // blue ×25
    for (let i = 0; i < 50; i++) pixels.push(0, 255, 0, 0); // transparent, ignored
    const palette = extractPalette(new Uint8ClampedArray(pixels), 2);
    expect(palette).toEqual([
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 0, b: 255 },
    ]);
  });

  it("stops early for single-colour images", () => {
    const pixels = new Uint8ClampedArray(40).fill(200);
    expect(extractPalette(pixels, 6)).toEqual([{ r: 200, g: 200, b: 200 }]);
  });
});

describe("rotate and crop maths", () => {
  it("swaps sides for quarter turns", () => {
    expect(rotatedSize(800, 600, 90)).toEqual({ width: 600, height: 800 });
    expect(rotatedSize(800, 600, 180)).toEqual({ width: 800, height: 600 });
  });

  it("converts percentage crops to clamped pixels", () => {
    expect(percentToPixels({ x: 25, y: 10, width: 50, height: 80 }, 1000, 500)).toEqual({ x: 250, y: 50, width: 500, height: 400 });
    expect(percentToPixels({ x: 90, y: 0, width: 20, height: 100 }, 1000, 500)).toEqual({ x: 900, y: 0, width: 100, height: 500 });
  });
});

describe("watermark placement", () => {
  it("computes rotated bounds", () => {
    const bounds = rotatedBounds(100, 20, 90);
    expect(bounds.width).toBeCloseTo(20);
    expect(bounds.height).toBeCloseTo(100);
  });

  it("anchors marks inside the margins", () => {
    expect(anchorPoint(1000, 800, 200, 100, "top-left", 10)).toEqual({ x: 110, y: 60 });
    expect(anchorPoint(1000, 800, 200, 100, "bottom-right", 10)).toEqual({ x: 890, y: 740 });
    expect(anchorPoint(1000, 800, 200, 100, "center", 10)).toEqual({ x: 500, y: 400 });
    expect(anchorPoint(1000, 800, 200, 100, "middle-right", 10)).toEqual({ x: 890, y: 400 });
  });

  it("tiles across the whole image", () => {
    const points = tileCenters(1000, 500, 100, 50, 50);
    expect(points.length).toBeGreaterThan(20);
    expect(Math.max(...points.map((p) => p.x)) + 50).toBeGreaterThanOrEqual(1000);
    expect(Math.max(...points.map((p) => p.y)) + 25).toBeGreaterThanOrEqual(500);
  });
});

describe("lossless metadata removal", () => {
  it("strips EXIF, XMP, comments and trailing data from JPEG but keeps the image data", () => {
    const input = fixture("gps.jpg");
    const { bytes, removed } = stripJpeg(input);

    expect(removed).toEqual(expect.arrayContaining(["EXIF", "XMP", "Comment", "Data after the image"]));
    for (const secret of ["Exif", "Jane Doe", "secret comment", "TRAILING"]) expect(text(bytes)).not.toContain(secret);
    expect([bytes[0], bytes[1]]).toEqual([0xff, 0xd8]);
    expect([bytes.at(-2), bytes.at(-1)]).toEqual([0xff, 0xd9]);

    // The compressed scan data is copied byte for byte.
    const scan = (data: Uint8Array) => text(data).slice(text(data).indexOf("\xff\xda"), text(data).indexOf("\xff\xd9") + 2);
    expect(scan(bytes)).toBe(scan(input));
    expect(tagsOf(bytes).gps).toBeUndefined();
  });

  it("leaves a clean JPEG unchanged", () => {
    const once = stripJpeg(fixture("gps.jpg")).bytes;
    const twice = stripJpeg(once);
    expect(twice.removed).toEqual([]);
    expect(twice.bytes).toEqual(once);
  });

  it("strips text and EXIF chunks from PNG", () => {
    const { bytes, removed } = stripPng(fixture("gps.png"));
    expect(removed).toEqual(expect.arrayContaining(["Text", "EXIF"]));
    for (const secret of ["tEXt", "eXIf", "Jane Doe"]) expect(text(bytes)).not.toContain(secret);
    expect(text(bytes)).toContain("IDAT");
    expect(text(bytes)).toContain("IEND");
  });

  it("strips EXIF and XMP from WebP and fixes the header", () => {
    const { bytes, removed } = stripWebp(fixture("gps.webp"));
    expect(removed).toEqual(["EXIF", "XMP"]);
    for (const secret of ["EXIF", "XMP ", "Jane Doe"]) expect(text(bytes)).not.toContain(secret);
    const view = new DataView(bytes.buffer, bytes.byteOffset);
    expect(view.getUint32(4, true)).toBe(bytes.length - 8);
    expect(bytes[20] & 0x0c).toBe(0); // EXIF/XMP flags cleared
  });

  it("rejects files that aren't the expected format", () => {
    expect(() => stripJpeg(fixture("photo.heic"))).toThrow(UnsupportedStructureError);
    expect(() => stripPng(fixture("photo.jpg"))).toThrow(UnsupportedStructureError);
  });
});

describe("metadata summary", () => {
  it("finds the location, camera and author", () => {
    const summary = summarizeMetadata(tagsOf(fixture("gps.jpg")));
    expect(summary.gps?.latitude).toBeCloseTo(51.5, 3);
    expect(summary.gps?.longitude).toBeCloseTo(-0.1167, 3);
    expect(summary.sensitive).toEqual(expect.arrayContaining(["GPS location", "Camera model", "Author details"]));
    expect(summary.groups.find((group) => group.id === "camera")?.rows).toContainEqual({ label: "Make", value: "TestCam" });
    expect(summary.orientation).toBe(1);
  });

  it("reports rotation stored in EXIF", () => {
    expect(summarizeMetadata(tagsOf(fixture("rotated-gps.jpg"))).orientation).toBe(6);
  });

  it("finds nothing sensitive in a clean image", () => {
    expect(summarizeMetadata(tagsOf(fixture("photo.jpg"))).sensitive).toEqual([]);
  });
});
