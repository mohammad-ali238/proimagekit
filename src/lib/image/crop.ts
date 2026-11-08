import type { ImageFormat } from "@/lib/tools-registry";
import { createCanvas, encodeCanvas, getContext } from "./encode";
import { formatInfo } from "./formats";
import type { Rect } from "./resize";

export interface PercentRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Converts a percentage crop (0–100) to whole pixels, clamped to the image. */
export function percentToPixels(crop: PercentRect, imageWidth: number, imageHeight: number): Rect {
  const x = Math.max(0, Math.min(imageWidth - 1, Math.round((crop.x / 100) * imageWidth)));
  const y = Math.max(0, Math.min(imageHeight - 1, Math.round((crop.y / 100) * imageHeight)));
  const width = Math.max(1, Math.min(imageWidth - x, Math.round((crop.width / 100) * imageWidth)));
  const height = Math.max(1, Math.min(imageHeight - y, Math.round((crop.height / 100) * imageHeight)));
  return { x, y, width, height };
}

export async function cropBitmap(bitmap: ImageBitmap, rect: Rect, format: ImageFormat): Promise<Blob> {
  const canvas = createCanvas(rect.width, rect.height);
  const context = getContext(canvas);
  if (!formatInfo[format].transparency) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, rect.width, rect.height);
  }
  context.drawImage(bitmap, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
  return encodeCanvas(canvas, format, 92);
}
