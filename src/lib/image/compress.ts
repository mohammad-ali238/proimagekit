import type { ImageFormat } from "@/lib/tools-registry";
import { decodeImage } from "./decode";
import { encodeCanvas } from "./encode";
import { formatInfo, renameForFormat, resolveOutputFormat } from "./formats";
import { fitCanvasLimits } from "./limits";
import { encodingQuality } from "./quality";
import { stripMetadataLosslessly } from "./remove-metadata";
import { fitWithin, planResize, renderResize } from "./resize";
import type { ProcessedImage } from "./types";

export interface CompressOptions {
  /** "original" keeps each file's format (HEIC becomes JPG; GIF and BMP become PNG). */
  format: ImageFormat | "original";
  /** 0–100 for lossy formats. */
  quality: number;
  maxWidth: number | null;
  maxHeight: number | null;
}

export async function compressImage(file: File, options: CompressOptions): Promise<ProcessedImage> {
  const { bitmap, format: inputFormat } = await decodeImage(file);
  try {
    const format = resolveOutputFormat(inputFormat, options.format);
    const limited = fitCanvasLimits(bitmap.width, bitmap.height);
    const target = fitWithin(limited.width, limited.height, options.maxWidth, options.maxHeight);
    const plan = planResize(bitmap.width, bitmap.height, {
      mode: "dimensions",
      width: target.width,
      height: target.height,
      keepAspect: true,
      fit: "contain",
    });
    const resized = plan.width !== bitmap.width || plan.height !== bitmap.height;

    const canvas = await renderResize(bitmap, plan, formatInfo[format].transparency ? null : "#ffffff");
    const blob = await encodeCanvas(canvas, format, encodingQuality(options.quality), "wasm");

    const base = {
      originalWidth: bitmap.width,
      originalHeight: bitmap.height,
      width: plan.width,
      height: plan.height,
    };

    // Re-encoding an already well-compressed file can make it bigger. Keep the
    // original image data then, but still remove its metadata (GPS etc.).
    if (!resized && format === inputFormat && blob.size >= file.size) {
      const stripped = await stripMetadataLosslessly(file);
      if (stripped && stripped.blob.size <= blob.size) {
        return { ...base, blob: stripped.blob, name: file.name, note: "Already optimised — original quality kept" };
      }
    }

    return {
      ...base,
      blob,
      name: renameForFormat(file.name, format),
      note: limited.width !== bitmap.width && !options.maxWidth && !options.maxHeight
        ? "Scaled down to fit your browser's limit"
        : undefined,
    };
  } finally {
    bitmap.close();
  }
}
