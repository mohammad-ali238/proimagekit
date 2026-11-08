import type { ImageFormat } from "@/lib/tools-registry";
import { decodeImage } from "./decode";
import { createCanvas, encodeCanvas, getContext, type Context2D } from "./encode";
import { formatInfo, renameForFormat, resolveOutputFormat } from "./formats";
import { fitCanvasLimits } from "./limits";
import type { ProcessedImage } from "./types";

export type Rotation = 0 | 90 | 180 | 270;

export interface TransformOptions {
  rotation: Rotation;
  flipHorizontal: boolean;
  flipVertical: boolean;
  format: ImageFormat | "original";
}

export function rotatedSize(width: number, height: number, rotation: Rotation) {
  return rotation === 90 || rotation === 270 ? { width: height, height: width } : { width, height };
}

/**
 * Draws the source rotated clockwise, then mirrored as seen on screen.
 * Canvas transforms apply to points in reverse order: rotate, then flip, then move to the centre.
 */
export function drawTransformed(
  context: Context2D,
  source: CanvasImageSource,
  width: number,
  height: number,
  { rotation, flipHorizontal, flipVertical }: Omit<TransformOptions, "format">,
): void {
  const output = rotatedSize(width, height, rotation);
  context.save();
  context.translate(output.width / 2, output.height / 2);
  context.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(source, -width / 2, -height / 2, width, height);
  context.restore();
}

export async function transformImage(file: File, options: TransformOptions): Promise<ProcessedImage> {
  const { bitmap, format: inputFormat } = await decodeImage(file);
  try {
    const format = resolveOutputFormat(inputFormat, options.format);
    const { width, height, scaled } = fitCanvasLimits(bitmap.width, bitmap.height);
    const output = rotatedSize(width, height, options.rotation);
    const canvas = createCanvas(output.width, output.height);
    const context = getContext(canvas);
    if (!formatInfo[format].transparency) {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, output.width, output.height);
    }
    drawTransformed(context, bitmap, width, height, options);

    return {
      blob: await encodeCanvas(canvas, format, 92),
      name: renameForFormat(file.name, format),
      width: output.width,
      height: output.height,
      originalWidth: bitmap.width,
      originalHeight: bitmap.height,
      note: scaled ? "Scaled down to fit your browser's limit" : undefined,
    };
  } finally {
    bitmap.close();
  }
}
