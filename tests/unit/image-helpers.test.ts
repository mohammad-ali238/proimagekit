import { describe, expect, it } from "vitest";
import { uniqueNames } from "@/lib/download";
import { formatBytes, percentChange } from "@/lib/format";
import { acceptFor, formatList, renameForFormat, sniffFormat } from "@/lib/image/formats";
import { fitCanvasLimits, IOS_MAX_CANVAS_PIXELS, isAppleMobile } from "@/lib/image/limits";

function bytes(...parts: (number[] | string)[]): Uint8Array {
  const out: number[] = [];
  for (const part of parts) {
    if (typeof part === "string") for (const char of part) out.push(char.charCodeAt(0));
    else out.push(...part);
  }
  while (out.length < 16) out.push(0);
  return new Uint8Array(out);
}

describe("sniffFormat", () => {
  it.each([
    ["jpeg", bytes([0xff, 0xd8, 0xff, 0xe0])],
    ["png", bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a])],
    ["webp", bytes("RIFF", [0, 0, 0, 0], "WEBP")],
    ["gif", bytes("GIF89a")],
    ["bmp", bytes("BM")],
    ["avif", bytes([0, 0, 0, 0x1c], "ftypavif")],
    ["heic", bytes([0, 0, 0, 0x18], "ftypheic")],
    ["heic", bytes([0, 0, 0, 0x18], "ftypmif1")],
  ])("detects %s", (format, data) => {
    expect(sniffFormat(data)).toBe(format);
  });

  it("returns null for unknown or short data", () => {
    expect(sniffFormat(bytes("hello world, not an image"))).toBeNull();
    expect(sniffFormat(new Uint8Array([0xff, 0xd8]))).toBeNull();
  });
});

describe("renameForFormat", () => {
  it("swaps the extension", () => {
    expect(renameForFormat("IMG_0001.HEIC", "jpeg")).toBe("IMG_0001.jpg");
    expect(renameForFormat("photo.final.webp", "png")).toBe("photo.final.png");
  });

  it("handles names without an extension", () => {
    expect(renameForFormat("scan", "avif")).toBe("scan.avif");
    expect(renameForFormat(".png", "jpeg")).toBe("image.jpg");
  });
});

describe("acceptFor / formatList", () => {
  it("maps HEIC to all its MIME types and extensions", () => {
    const accept = acceptFor(["heic"]);
    expect(accept["image/heic"]).toEqual([".heic", ".heif"]);
    expect(accept["image/heif"]).toEqual([".heic", ".heif"]);
  });

  it("accepts every decodable format for 'any'", () => {
    expect(Object.keys(acceptFor("any"))).toEqual(expect.arrayContaining(["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic"]));
  });

  it("lists formats in plain English", () => {
    expect(formatList(["webp"])).toBe("WebP");
    expect(formatList(["jpeg", "png", "webp"])).toBe("JPG, PNG or WebP");
  });
});

describe("canvas limits", () => {
  it("leaves images within the limit alone", () => {
    expect(fitCanvasLimits(4000, 3000, IOS_MAX_CANVAS_PIXELS)).toEqual({ width: 4000, height: 3000, scaled: false });
  });

  it("scales large images down to the pixel limit, keeping the aspect ratio", () => {
    const { width, height, scaled } = fitCanvasLimits(8064, 6048, IOS_MAX_CANVAS_PIXELS);
    expect(scaled).toBe(true);
    expect(width * height).toBeLessThanOrEqual(IOS_MAX_CANVAS_PIXELS);
    expect(width / height).toBeCloseTo(8064 / 6048, 2);
  });

  it("caps very long sides", () => {
    expect(fitCanvasLimits(40000, 100, Infinity, 16384).width).toBe(16384);
  });

  it("recognises iPhones and iPads", () => {
    expect(isAppleMobile("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", 5)).toBe(true);
    expect(isAppleMobile("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe(true);
    expect(isAppleMobile("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe(false);
  });
});

describe("formatting", () => {
  it("formats byte sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(formatBytes(250 * 1024)).toBe("250 KB");
  });

  it("computes percentage change", () => {
    expect(percentChange(1000, 250)).toBe(-75);
    expect(percentChange(1000, 1500)).toBe(50);
    expect(percentChange(0, 10)).toBe(0);
  });
});

describe("uniqueNames", () => {
  it("numbers duplicate file names for the ZIP", () => {
    expect(uniqueNames(["a.jpg", "b.jpg", "A.jpg", "a.jpg", "noext", "noext"])).toEqual([
      "a.jpg",
      "b.jpg",
      "A (2).jpg",
      "a (3).jpg",
      "noext",
      "noext (2)",
    ]);
  });
});
