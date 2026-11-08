import { describe, expect, it, vi } from "vitest";
import {
  applyCrop,
  centredCropRect,
  createElement,
  createImageElement,
  createWatermark,
  describeElement,
  duplicateElement,
  groupBursts,
  hasFilters,
  defaultFilters,
  moveElement,
  normalizeCrop,
  removeElement,
  updateElement,
  type EditorDocument,
} from "@/lib/editor/document";

function makeDoc(): EditorDocument {
  return {
    width: 1000,
    height: 800,
    background: null,
    elements: [createImageElement("blob:photo", 1000, 800, "Photo"), createElement("text", { width: 1000, height: 800 })],
  };
}

describe("creating elements", () => {
  it("sizes and centres new shapes relative to the document", () => {
    const doc = { width: 2000, height: 1000 };
    const rect = createElement("rect", doc);
    expect(rect.type).toBe("rect");
    if (rect.type !== "rect") return;
    expect(rect.x + rect.width / 2).toBeCloseTo(1000);
    expect(rect.y + rect.height / 2).toBeCloseTo(500);
    expect(rect.fill).toBe("transparent");
  });

  it("gives every element a unique id", () => {
    const ids = Array.from({ length: 50 }, () => createElement("ellipse", { width: 100, height: 100 }).id);
    expect(new Set(ids).size).toBe(50);
  });

  it("places the watermark in the bottom-right corner", () => {
    const mark = createWatermark({ width: 1000, height: 800 });
    expect(mark.opacity).toBeLessThan(1);
    expect(mark.x).toBeGreaterThan(500);
    expect(mark.y).toBeGreaterThan(700);
  });

  it("starts images without filters", () => {
    const image = createImageElement("blob:x", 10, 10);
    expect(hasFilters(image.filters)).toBe(false);
    expect(hasFilters({ ...defaultFilters, grayscale: true })).toBe(true);
  });
});

describe("document operations", () => {
  it("updates only the targeted element and keeps others by reference", () => {
    const doc = makeDoc();
    const [photo, text] = doc.elements;
    const next = updateElement(doc, text.id, { opacity: 0.5 });
    expect(next.elements[1].opacity).toBe(0.5);
    expect(next.elements[0]).toBe(photo);
    expect(doc.elements[1].opacity).toBe(1); // original untouched
  });

  it("removes elements", () => {
    const doc = makeDoc();
    expect(removeElement(doc, doc.elements[0].id).elements).toHaveLength(1);
  });

  it("duplicates right above the source with an offset and unlocked", () => {
    const doc = makeDoc();
    const locked = updateElement(doc, doc.elements[0].id, { locked: true });
    const { doc: next, id } = duplicateElement(locked, doc.elements[0].id);
    expect(next.elements).toHaveLength(3);
    expect(next.elements[1].id).toBe(id);
    expect(next.elements[1].x).toBeGreaterThan(doc.elements[0].x);
    expect(next.elements[1].locked).toBe(false);
    expect(next.elements[1].name).toBe("Photo copy");
  });

  it("reorders layers and ignores moves past either end", () => {
    const doc = makeDoc();
    const [photo, text] = doc.elements;
    expect(moveElement(doc, photo.id, "up").elements.map((e) => e.id)).toEqual([text.id, photo.id]);
    expect(moveElement(doc, photo.id, "down")).toBe(doc);
    expect(moveElement(doc, text.id, "up")).toBe(doc);
  });

  it("describes text layers by their content", () => {
    const text = createElement("text", { width: 100, height: 100 });
    expect(describeElement(text)).toBe("Double-click to edit");
    expect(describeElement(createElement("rect", { width: 100, height: 100 }))).toBe("Rectangle");
  });
});

describe("cropping", () => {
  it("clamps and rounds crop rectangles", () => {
    expect(normalizeCrop({ x: -20, y: 10.4, width: 5000, height: 99.6 }, { width: 1000, height: 800 })).toEqual({
      x: 0,
      y: 10,
      width: 1000,
      height: 100,
    });
  });

  it("resizes the document and shifts every element", () => {
    const doc = makeDoc();
    const cropped = applyCrop(doc, { x: 100, y: 50, width: 400, height: 300 });
    expect([cropped.width, cropped.height]).toEqual([400, 300]);
    expect(cropped.elements[0].x).toBe(-100);
    expect(cropped.elements[0].y).toBe(-50);
    expect(cropped.elements[1].x).toBe(doc.elements[1].x - 100);
  });

  it("centres aspect-ratio crops", () => {
    expect(centredCropRect({ width: 1000, height: 800 }, 1)).toEqual({ x: 100, y: 0, width: 800, height: 800 });
    expect(centredCropRect({ width: 1000, height: 800 }, 16 / 9)).toEqual({ x: 0, y: 118.75, width: 1000, height: 562.5 });
    expect(centredCropRect({ width: 1000, height: 800 }, null)).toEqual({ x: 0, y: 0, width: 1000, height: 800 });
  });
});

describe("undo grouping", () => {
  it("records only the first change of a burst", () => {
    let time = 0;
    const record = vi.fn();
    const grouped = groupBursts(record, 400, { now: () => time });

    grouped("a");
    time = 100;
    grouped("b"); // same slider drag
    time = 300;
    grouped("c");
    time = 800; // pause, new gesture
    grouped("d");

    expect(record.mock.calls).toEqual([["a"], ["d"]]);
  });

  it("gives discrete actions their own step and ends the burst", () => {
    let time = 0;
    let discrete = false;
    const record = vi.fn();
    const grouped = groupBursts(record, 400, { now: () => time, isDiscrete: () => discrete });

    grouped("slider");
    time = 50;
    discrete = true;
    grouped("add"); // recorded despite being inside the window
    time = 100;
    grouped("delete");
    discrete = false;
    time = 150;
    grouped("slider again"); // a new burst starts after a discrete action
    time = 200;
    grouped("slider again 2");

    expect(record.mock.calls).toEqual([["slider"], ["add"], ["delete"], ["slider again"]]);
  });
});
