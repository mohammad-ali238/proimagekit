import type { ImageFormat } from "@/lib/tools-registry";
import { decodeImage } from "./decode";
import { createCanvas, encodeCanvas, getContext, type Context2D } from "./encode";
import { formatInfo, renameForFormat, resolveOutputFormat } from "./formats";
import { fitCanvasLimits } from "./limits";
import type { ProcessedImage } from "./types";

export const watermarkPositions = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;

export type WatermarkPosition = (typeof watermarkPositions)[number] | "tile";

export interface WatermarkOptions {
  kind: "text" | "image";
  text: string;
  color: string;
  /** Text height as a percentage of the image width. */
  textSize: number;
  logo: File | null;
  /** Logo width as a percentage of the image width. */
  logoSize: number;
  /** 0–100 */
  opacity: number;
  /** Degrees, clockwise. */
  rotation: number;
  position: WatermarkPosition;
  /** Distance from the edges as a percentage of the image's shorter side. */
  margin: number;
  format: ImageFormat | "original";
}

export interface Point {
  x: number;
  y: number;
}

/** Size of the box that contains a width × height rectangle rotated by `degrees`. */
export function rotatedBounds(width: number, height: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  return { width: width * cos + height * sin, height: width * sin + height * cos };
}

/** Centre point for a mark of the given (rotated) size at one of the nine positions. */
export function anchorPoint(
  canvasWidth: number,
  canvasHeight: number,
  markWidth: number,
  markHeight: number,
  position: Exclude<WatermarkPosition, "tile">,
  margin: number,
): Point {
  const [vertical, horizontal] = position === "center" ? ["middle", "center"] : position.split("-");
  const x =
    horizontal === "left" ? margin + markWidth / 2 : horizontal === "right" ? canvasWidth - margin - markWidth / 2 : canvasWidth / 2;
  const y =
    vertical === "top" ? margin + markHeight / 2 : vertical === "bottom" ? canvasHeight - margin - markHeight / 2 : canvasHeight / 2;
  return { x, y };
}

/**
 * Centre points for a repeating pattern that covers the whole canvas, offset
 * every other row. Marks run off the edges so the pattern can't be cropped away.
 */
export function tileCenters(canvasWidth: number, canvasHeight: number, markWidth: number, markHeight: number, gap: number): Point[] {
  const stepX = Math.max(1, markWidth + gap);
  const stepY = Math.max(1, markHeight + gap);
  const points: Point[] = [];
  for (let row = 0, y = 0; y - markHeight / 2 < canvasHeight; row++, y += stepY) {
    for (let x = row % 2 === 0 ? 0 : -stepX / 2; x - markWidth / 2 < canvasWidth; x += stepX) points.push({ x, y });
  }
  return points;
}

// Logos are decoded once and reused for every image in the batch.
const logoCache = new WeakMap<File, Promise<ImageBitmap>>();

function loadLogo(file: File): Promise<ImageBitmap> {
  let bitmap = logoCache.get(file);
  if (!bitmap) {
    bitmap = decodeImage(file).then((decoded) => decoded.bitmap);
    logoCache.set(file, bitmap);
  }
  return bitmap;
}

type Mark = { width: number; height: number; draw: (context: Context2D) => void };

async function createMark(options: WatermarkOptions, imageWidth: number): Promise<Mark | null> {
  if (options.kind === "image") {
    if (!options.logo) return null;
    const logo = await loadLogo(options.logo);
    const width = Math.max(1, (imageWidth * options.logoSize) / 100);
    const height = (width * logo.height) / logo.width;
    return { width, height, draw: (context) => context.drawImage(logo, -width / 2, -height / 2, width, height) };
  }

  const text = options.text.trim();
  if (!text) return null;
  const fontSize = Math.max(8, (imageWidth * options.textSize) / 100);
  const font = `600 ${fontSize}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  const measure = getContext(createCanvas(1, 1));
  measure.font = font;
  const width = measure.measureText(text).width;
  const height = fontSize * 1.2;
  return {
    width,
    height,
    draw: (context) => {
      context.font = font;
      context.fillStyle = options.color;
      context.textAlign = "center";
      context.textBaseline = "middle";
      // A soft shadow keeps the text readable on both light and dark photos.
      context.shadowColor = "rgba(0, 0, 0, 0.35)";
      context.shadowBlur = fontSize * 0.08;
      context.fillText(text, 0, 0);
    },
  };
}

export async function watermarkImage(file: File, options: WatermarkOptions): Promise<ProcessedImage> {
  const { bitmap, format: inputFormat } = await decodeImage(file);
  try {
    const format = resolveOutputFormat(inputFormat, options.format);
    const { width, height, scaled } = fitCanvasLimits(bitmap.width, bitmap.height);
    const canvas = createCanvas(width, height);
    const context = getContext(canvas);
    if (!formatInfo[format].transparency) {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(bitmap, 0, 0, width, height);

    const mark = await createMark(options, width);
    if (mark) {
      const bounds = rotatedBounds(mark.width, mark.height, options.rotation);
      const margin = (Math.min(width, height) * options.margin) / 100;
      const centres =
        options.position === "tile"
          ? tileCenters(width, height, bounds.width, bounds.height, Math.max(margin, mark.height))
          : [anchorPoint(width, height, bounds.width, bounds.height, options.position, margin)];

      context.globalAlpha = options.opacity / 100;
      for (const { x, y } of centres) {
        context.save();
        context.translate(x, y);
        context.rotate((options.rotation * Math.PI) / 180);
        mark.draw(context);
        context.restore();
      }
      context.globalAlpha = 1;
    }

    return {
      blob: await encodeCanvas(canvas, format, 92),
      name: renameForFormat(file.name, format).replace(/(\.[^.]+)$/, "-watermarked$1"),
      width,
      height,
      originalWidth: bitmap.width,
      originalHeight: bitmap.height,
      note: scaled ? "Scaled down to fit your browser's limit" : mark ? undefined : "No watermark set yet",
    };
  } finally {
    bitmap.close();
  }
}
