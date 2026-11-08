import { resizeWithWasm } from "@/lib/workers/codec-client";
import { createCanvas, getContext, type Canvas2D } from "./encode";
import { MAX_CANVAS_SIDE, maxCanvasPixels } from "./limits";

/** How an image is fitted into an exact width × height when the aspect ratio isn't kept. */
export type FitMode = "stretch" | "cover" | "contain";

export type ResizeSpec =
  | { mode: "percent"; percent: number }
  | {
      mode: "dimensions";
      width: number | null;
      height: number | null;
      /** When true, the image is scaled to fit inside width × height without distortion. */
      keepAspect: boolean;
      fit: FitMode;
    };

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResizePlan {
  /** Output image size. */
  width: number;
  height: number;
  /** Part of the source image that is used. */
  source: Rect;
  /** Where the (scaled) source is drawn in the output. */
  target: Rect;
  /** True when the output has empty areas that need a background (contain). */
  padded: boolean;
}

const clampSize = (value: number) => Math.max(1, Math.round(value));

/** Largest size that fits inside maxWidth × maxHeight, keeping the aspect ratio. Never enlarges. */
export function fitWithin(width: number, height: number, maxWidth: number | null, maxHeight: number | null) {
  const scale = Math.min(1, maxWidth ? maxWidth / width : 1, maxHeight ? maxHeight / height : 1);
  return { width: clampSize(width * scale), height: clampSize(height * scale), scaled: scale < 1 };
}

function simplePlan(sourceWidth: number, sourceHeight: number, width: number, height: number): ResizePlan {
  const full = { x: 0, y: 0, width: sourceWidth, height: sourceHeight };
  return { width, height, source: full, target: { x: 0, y: 0, width, height }, padded: false };
}

/** Works out the output size, crop and placement for a resize. Pure, so it can be unit tested. */
export function planResize(sourceWidth: number, sourceHeight: number, spec: ResizeSpec): ResizePlan {
  if (spec.mode === "percent") {
    const scale = spec.percent / 100;
    return simplePlan(sourceWidth, sourceHeight, clampSize(sourceWidth * scale), clampSize(sourceHeight * scale));
  }

  const { width, height } = spec;
  if (!width && !height) return simplePlan(sourceWidth, sourceHeight, sourceWidth, sourceHeight);

  // Only one side given: scale proportionally from it.
  if (!width || !height) {
    const scale = width ? width / sourceWidth : height! / sourceHeight;
    return simplePlan(sourceWidth, sourceHeight, clampSize(sourceWidth * scale), clampSize(sourceHeight * scale));
  }

  if (spec.keepAspect) {
    const scale = Math.min(width / sourceWidth, height / sourceHeight);
    return simplePlan(sourceWidth, sourceHeight, clampSize(sourceWidth * scale), clampSize(sourceHeight * scale));
  }

  switch (spec.fit) {
    case "stretch":
      return simplePlan(sourceWidth, sourceHeight, clampSize(width), clampSize(height));
    case "cover": {
      // Crop the centre of the source to the target's aspect ratio.
      const targetRatio = width / height;
      const cropWidth = Math.min(sourceWidth, sourceHeight * targetRatio);
      const cropHeight = Math.min(sourceHeight, sourceWidth / targetRatio);
      return {
        width: clampSize(width),
        height: clampSize(height),
        source: {
          x: Math.round((sourceWidth - cropWidth) / 2),
          y: Math.round((sourceHeight - cropHeight) / 2),
          width: clampSize(cropWidth),
          height: clampSize(cropHeight),
        },
        target: { x: 0, y: 0, width: clampSize(width), height: clampSize(height) },
        padded: false,
      };
    }
    case "contain": {
      const scale = Math.min(width / sourceWidth, height / sourceHeight);
      const drawWidth = clampSize(sourceWidth * scale);
      const drawHeight = clampSize(sourceHeight * scale);
      return {
        width: clampSize(width),
        height: clampSize(height),
        source: { x: 0, y: 0, width: sourceWidth, height: sourceHeight },
        target: {
          x: Math.round((width - drawWidth) / 2),
          y: Math.round((height - drawHeight) / 2),
          width: drawWidth,
          height: drawHeight,
        },
        padded: drawWidth < width || drawHeight < height,
      };
    }
  }
}

export class ImageTooLargeError extends Error {
  constructor(width: number, height: number) {
    super(`${width} × ${height} is too large for your browser to create. Try a smaller size.`);
    this.name = "ImageTooLargeError";
  }
}

export function assertCanvasSize(width: number, height: number): void {
  if (width > MAX_CANVAS_SIDE || height > MAX_CANVAS_SIDE || width * height > maxCanvasPixels()) {
    throw new ImageTooLargeError(width, height);
  }
}

async function scalePixels(source: Canvas2D, width: number, height: number): Promise<Canvas2D> {
  const output = createCanvas(width, height);
  const context = getContext(output);
  try {
    const pixels = getContext(source).getImageData(0, 0, source.width, source.height);
    context.putImageData(await resizeWithWasm(pixels, width, height), 0, 0);
  } catch {
    // Fall back to the browser's own (slightly softer) scaling.
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, width, height);
  }
  return output;
}

/**
 * Renders a resize plan. Scaling uses Lanczos3 in the worker for sharp results.
 * @param background fill colour for padding and transparency, or null to keep transparency.
 */
export async function renderResize(bitmap: ImageBitmap, plan: ResizePlan, background: string | null): Promise<Canvas2D> {
  assertCanvasSize(plan.width, plan.height);
  const { source, target } = plan;

  const cropped = createCanvas(source.width, source.height);
  getContext(cropped).drawImage(bitmap, source.x, source.y, source.width, source.height, 0, 0, source.width, source.height);

  const scaled =
    target.width === source.width && target.height === source.height
      ? cropped
      : await scalePixels(cropped, target.width, target.height);

  if (!background && !plan.padded && target.width === plan.width && target.height === plan.height) return scaled;

  const output = createCanvas(plan.width, plan.height);
  const context = getContext(output);
  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, plan.width, plan.height);
  }
  context.drawImage(scaled, target.x, target.y);
  return output;
}
