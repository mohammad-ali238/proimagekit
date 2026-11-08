import { decodeImage } from "./decode";
import { createCanvas, encodeCanvas, getContext } from "./encode";
import { detectFormat, formatInfo, renameForFormat, resolveOutputFormat } from "./formats";
import { fitCanvasLimits } from "./limits";
import { readMetadata, summarizeMetadata } from "./metadata";
import { stripJpeg, stripPng, stripWebp, type StripResult } from "./strip-metadata";
import type { ProcessedImage } from "./types";

/** The EXIF remover has no settings; this shared object keeps the queue from re-running. */
export const removeMetadataOptions = {} as const;

const strippers: Partial<Record<string, (bytes: Uint8Array) => StripResult>> = {
  jpeg: stripJpeg,
  png: stripPng,
  webp: stripWebp,
};

function describeRemoval(sensitive: string[], removedBlocks: string[]): string {
  if (sensitive.length) return `Removed: ${sensitive.join(", ")}`;
  if (removedBlocks.length) return `Removed: ${removedBlocks.join(", ")}`;
  return "No metadata found";
}

/** Re-draws the pixels (applying any EXIF rotation) and saves a clean copy. */
async function resave(file: File, quality: number) {
  const { bitmap, format: inputFormat } = await decodeImage(file);
  try {
    const format = resolveOutputFormat(inputFormat, "original");
    const { width, height } = fitCanvasLimits(bitmap.width, bitmap.height);
    const canvas = createCanvas(width, height);
    const context = getContext(canvas);
    if (!formatInfo[format].transparency) {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(bitmap, 0, 0, width, height);
    return {
      blob: await encodeCanvas(canvas, format, quality),
      name: renameForFormat(file.name, format),
      width,
      height,
      originalWidth: bitmap.width,
      originalHeight: bitmap.height,
    };
  } finally {
    bitmap.close();
  }
}

async function imageSize(blob: Blob) {
  const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
}

/**
 * Removes metadata without re-encoding, when the format allows it. Returns
 * null for formats we can't rewrite and for JPEGs whose EXIF says "rotate",
 * since removing that tag would show the photo sideways.
 */
export async function stripMetadataLosslessly(
  file: Blob,
): Promise<{ blob: Blob; removed: string[]; sensitive: string[] } | null> {
  const [format, tags] = await Promise.all([detectFormat(file), readMetadata(file)]);
  const summary = summarizeMetadata(tags);
  const strip = format ? strippers[format] : undefined;
  const rotated = format === "jpeg" && summary.orientation !== null && summary.orientation !== 1;
  if (!format || !strip || rotated) return null;
  const { bytes, removed } = strip(new Uint8Array(await file.arrayBuffer()));
  return { blob: new Blob([bytes as Uint8Array<ArrayBuffer>], { type: formatInfo[format].mime }), removed, sensitive: summary.sensitive };
}

export async function removeMetadata(file: File): Promise<ProcessedImage> {
  // Lossless path: rewrite the file without its metadata blocks.
  const stripped = await stripMetadataLosslessly(file);
  if (stripped) {
    const { width, height } = await imageSize(stripped.blob);
    return {
      blob: stripped.blob,
      name: file.name,
      width,
      height,
      originalWidth: width,
      originalHeight: height,
      note: `${describeRemoval(stripped.sensitive, stripped.removed)} · image data untouched`,
    };
  }

  // Rotated JPEGs and other formats: the rotation is baked into the pixels and a clean copy is saved.
  const [format, tags] = await Promise.all([detectFormat(file), readMetadata(file)]);
  const summary = summarizeMetadata(tags);
  const rotated = format === "jpeg" && summary.orientation !== null && summary.orientation !== 1;
  const result = await resave(file, 95);
  return {
    ...result,
    note: `${describeRemoval(summary.sensitive, [])} · re-saved${rotated ? " upright" : ""} at high quality`,
  };
}
