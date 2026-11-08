/**
 * Browsers cap canvas size. iOS/iPadOS Safari refuses canvases above
 * 16,777,216 pixels (4096×4096); desktop browsers allow far more, but very
 * large canvases can exhaust memory, so we cap them too.
 */
export const IOS_MAX_CANVAS_PIXELS = 16_777_216;
export const DESKTOP_MAX_CANVAS_PIXELS = 100_000_000;
export const MAX_CANVAS_SIDE = 16_384;

export function isAppleMobile(userAgent: string, maxTouchPoints: number): boolean {
  // iPadOS reports itself as macOS; touch support tells them apart.
  return /iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
}

export function maxCanvasPixels(): number {
  if (typeof navigator === "undefined") return DESKTOP_MAX_CANVAS_PIXELS;
  return isAppleMobile(navigator.userAgent, navigator.maxTouchPoints ?? 0)
    ? IOS_MAX_CANVAS_PIXELS
    : DESKTOP_MAX_CANVAS_PIXELS;
}

/** Scales dimensions down (never up) so they fit the canvas limits, keeping the aspect ratio. */
export function fitCanvasLimits(
  width: number,
  height: number,
  maxPixels: number = maxCanvasPixels(),
  maxSide: number = MAX_CANVAS_SIDE,
): { width: number; height: number; scaled: boolean } {
  const scale = Math.min(1, Math.sqrt(maxPixels / (width * height)), maxSide / width, maxSide / height);
  if (scale >= 1) return { width, height, scaled: false };
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
    scaled: true,
  };
}
