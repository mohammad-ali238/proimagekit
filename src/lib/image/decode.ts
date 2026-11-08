import type { ImageFormat } from "@/lib/tools-registry";
import { detectFormat } from "./formats";

export class UnsupportedImageError extends Error {
  constructor(message = "This file isn't an image we can read.") {
    super(message);
    this.name = "UnsupportedImageError";
  }
}

export interface DecodedImage {
  bitmap: ImageBitmap;
  format: ImageFormat | null;
}

async function decodeHeic(file: Blob): Promise<ImageBitmap> {
  // Safari 17+ decodes HEIC natively, which is much faster than WebAssembly.
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Loaded on demand (~3 MB). The CSP build avoids eval, which our policy forbids.
    const { heicTo } = await import("heic-to/csp");
    return heicTo({ blob: file, type: "bitmap" });
  }
}

/** Decodes any supported image into a bitmap, applying EXIF orientation. */
export async function decodeImage(file: Blob): Promise<DecodedImage> {
  const format = await detectFormat(file);
  try {
    if (format === "heic") return { bitmap: await decodeHeic(file), format };
    return { bitmap: await createImageBitmap(file, { imageOrientation: "from-image" }), format };
  } catch {
    throw new UnsupportedImageError(
      format ? `Your browser couldn't read this ${format.toUpperCase()} file. It may be damaged.` : undefined,
    );
  }
}
