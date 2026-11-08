import { describe, expect, it } from "vitest";
import { parseDimension } from "@/lib/format";
import { resolveOutputFormat } from "@/lib/image/formats";
import { sizePresets } from "@/lib/image/presets";
import { fitWithin, planResize, type ResizeSpec } from "@/lib/image/resize";

const dims = (width: number | null, height: number | null, keepAspect = true, fit: "stretch" | "cover" | "contain" = "cover"): ResizeSpec => ({
  mode: "dimensions",
  width,
  height,
  keepAspect,
  fit,
});

describe("planResize", () => {
  it("scales by percentage", () => {
    const plan = planResize(4000, 3000, { mode: "percent", percent: 25 });
    expect([plan.width, plan.height]).toEqual([1000, 750]);
    expect(plan.source).toEqual({ x: 0, y: 0, width: 4000, height: 3000 });
  });

  it("keeps the original size when no dimensions are given", () => {
    const plan = planResize(800, 600, dims(null, null));
    expect([plan.width, plan.height]).toEqual([800, 600]);
  });

  it("derives the missing side from one dimension", () => {
    expect(planResize(4000, 3000, dims(1000, null))).toMatchObject({ width: 1000, height: 750 });
    expect(planResize(4000, 3000, dims(null, 600))).toMatchObject({ width: 800, height: 600 });
    // Even with the lock off, a single side can't distort.
    expect(planResize(4000, 3000, dims(1000, null, false, "stretch"))).toMatchObject({ width: 1000, height: 750 });
  });

  it("fits inside the box when keeping the aspect ratio", () => {
    expect(planResize(4000, 3000, dims(1000, 1000))).toMatchObject({ width: 1000, height: 750 });
    expect(planResize(3000, 4000, dims(1000, 1000))).toMatchObject({ width: 750, height: 1000 });
  });

  it("stretches to the exact size", () => {
    const plan = planResize(4000, 3000, dims(500, 500, false, "stretch"));
    expect(plan).toMatchObject({ width: 500, height: 500, padded: false });
    expect(plan.source).toEqual({ x: 0, y: 0, width: 4000, height: 3000 });
  });

  it("crops the centre for cover", () => {
    const plan = planResize(4000, 3000, dims(1080, 1080, false, "cover"));
    expect([plan.width, plan.height]).toEqual([1080, 1080]);
    expect(plan.source).toEqual({ x: 500, y: 0, width: 3000, height: 3000 });
    expect(plan.target).toEqual({ x: 0, y: 0, width: 1080, height: 1080 });
  });

  it("crops top and bottom for a wide target", () => {
    const plan = planResize(1000, 1000, dims(1600, 900, false, "cover"));
    expect(plan.source).toEqual({ x: 0, y: 219, width: 1000, height: 563 });
  });

  it("centres and pads for contain", () => {
    const plan = planResize(4000, 2000, dims(1000, 1000, false, "contain"));
    expect([plan.width, plan.height]).toEqual([1000, 1000]);
    expect(plan.target).toEqual({ x: 0, y: 250, width: 1000, height: 500 });
    expect(plan.padded).toBe(true);
  });

  it("never produces zero-sized images", () => {
    const plan = planResize(10, 1000, { mode: "percent", percent: 5 });
    expect(plan.width).toBeGreaterThanOrEqual(1);
  });
});

describe("fitWithin", () => {
  it("shrinks to the limit but never enlarges", () => {
    expect(fitWithin(4000, 3000, 2000, null)).toEqual({ width: 2000, height: 1500, scaled: true });
    expect(fitWithin(4000, 3000, 2000, 1000)).toEqual({ width: 1333, height: 1000, scaled: true });
    expect(fitWithin(800, 600, 2000, 2000)).toEqual({ width: 800, height: 600, scaled: false });
    expect(fitWithin(800, 600, null, null)).toEqual({ width: 800, height: 600, scaled: false });
  });
});

describe("resolveOutputFormat", () => {
  it("keeps writable formats and maps the rest", () => {
    expect(resolveOutputFormat("webp", "original")).toBe("webp");
    expect(resolveOutputFormat("heic", "original")).toBe("jpeg");
    expect(resolveOutputFormat("gif", "original")).toBe("png");
    expect(resolveOutputFormat(null, "original")).toBe("jpeg");
    expect(resolveOutputFormat("png", "avif")).toBe("avif");
  });
});

describe("parseDimension", () => {
  it("accepts positive whole numbers and caps them", () => {
    expect(parseDimension("1080")).toBe(1080);
    expect(parseDimension(" 99.6 ")).toBe(100);
    expect(parseDimension("99999")).toBe(16384);
  });

  it("treats empty or invalid input as unset", () => {
    expect(parseDimension("")).toBeNull();
    expect(parseDimension("0")).toBeNull();
    expect(parseDimension("-5")).toBeNull();
    expect(parseDimension("abc")).toBeNull();
  });
});

describe("size presets", () => {
  it("have unique ids and sensible sizes", () => {
    expect(new Set(sizePresets.map((preset) => preset.id)).size).toBe(sizePresets.length);
    for (const preset of sizePresets) {
      expect(preset.width).toBeGreaterThan(0);
      expect(preset.height).toBeGreaterThan(0);
      expect(preset.width).toBeLessThanOrEqual(4096);
    }
  });
});
