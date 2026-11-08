import type { ImageFormat } from "@/lib/tools-registry";
import { decodeImage } from "./decode";
import { encodeCanvas } from "./encode";
import { formatInfo, renameForFormat, resolveOutputFormat } from "./formats";
import { planResize, renderResize, type ResizeSpec } from "./resize";
import type { ProcessedImage } from "./types";

export interface ResizeOptions {
  spec: ResizeSpec;
  /** "original" keeps each file's format (HEIC becomes JPG; GIF and BMP become PNG). */
  format: ImageFormat | "original";
  /** Fill colour for padding ("fit inside") and for formats without transparency. */
  background: string;
}

const RESIZE_QUALITY = 92;

export async function resizeImage(file: File, options: ResizeOptions): Promise<ProcessedImage> {
  const { bitmap, format: inputFormat } = await decodeImage(file);
  try {
    const format = resolveOutputFormat(inputFormat, options.format);
    const plan = planResize(bitmap.width, bitmap.height, options.spec);
    const needsBackground = plan.padded || !formatInfo[format].transparency;

    const canvas = await renderResize(bitmap, plan, needsBackground ? options.background : null);
    const enlarged = plan.target.width > plan.source.width || plan.target.height > plan.source.height;

    return {
      blob: await encodeCanvas(canvas, format, RESIZE_QUALITY),
      name: renameForFormat(file.name, format).replace(/(\.[^.]+)$/, `-${plan.width}x${plan.height}$1`),
      width: plan.width,
      height: plan.height,
      originalWidth: bitmap.width,
      originalHeight: bitmap.height,
      note: enlarged ? "Enlarged — may look soft" : undefined,
    };
  } finally {
    bitmap.close();
  }
}
