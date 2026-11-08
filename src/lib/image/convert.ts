import type { ImageFormat } from "@/lib/tools-registry";
import { decodeImage } from "./decode";
import { createCanvas, encodeCanvas, getContext } from "./encode";
import { formatInfo, renameForFormat } from "./formats";
import { fitCanvasLimits } from "./limits";
import { encodingQuality } from "./quality";
import type { ProcessedImage } from "./types";

export interface ConvertOptions {
  format: ImageFormat;
  /** 0–100 for lossy formats. */
  quality: number;
  /** Fill colour for transparent pixels when the output has no transparency (e.g. JPG). */
  background: string;
}

/** Shared conversion pipeline used by every converter tool: decode → draw → encode. */
export async function convertImage(file: File, options: ConvertOptions): Promise<ProcessedImage> {
  const { bitmap } = await decodeImage(file);
  try {
    const { width, height, scaled } = fitCanvasLimits(bitmap.width, bitmap.height);
    const canvas = createCanvas(width, height);
    const context = getContext(canvas);

    if (!formatInfo[options.format].transparency) {
      context.fillStyle = options.background;
      context.fillRect(0, 0, width, height);
    }
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);

    return {
      blob: await encodeCanvas(canvas, options.format, encodingQuality(options.quality)),
      name: renameForFormat(file.name, options.format),
      width,
      height,
      originalWidth: bitmap.width,
      originalHeight: bitmap.height,
      note: scaled ? "Scaled down to fit your browser's limit" : undefined,
    };
  } finally {
    bitmap.close();
  }
}
