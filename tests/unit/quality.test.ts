import { describe, expect, it } from "vitest";
import { encodingQuality, MAX_ENCODE_QUALITY } from "@/lib/image/quality";

describe("encodingQuality", () => {
  it("uses values up to the cap as chosen", () => {
    for (const value of [10, 40, 60, 70, 75, 80]) expect(encodingQuality(value)).toBe(value);
  });

  it("never encodes above the cap", () => {
    expect(MAX_ENCODE_QUALITY).toBe(80);
    for (const value of [81, 90, 95, 100]) expect(encodingQuality(value)).toBe(80);
  });

  it("clamps nonsense input", () => {
    expect(encodingQuality(-5)).toBe(0);
  });
});
