import type { ImageFormat } from "@/lib/tools-registry";
import { createCanvas, getContext } from "./encode";

async function canvasBlob(bitmap: ImageBitmap, width: number, height: number): Promise<Blob> {
  const canvas = createCanvas(width, height);
  const context = getContext(canvas);
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  if ("convertToBlob" in canvas) return canvas.convertToBlob({ type: "image/png" });
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't prepare the image."))), "image/png"),
  );
}

/**
 * Returns an object URL that any browser can display and draw, matching the
 * decoded bitmap's orientation. Formats browsers show natively use the
 * original file; HEIC (or a downscaled copy) is re-rendered as PNG.
 */
export async function displayUrl(
  file: File,
  format: ImageFormat | null,
  bitmap: ImageBitmap,
  size: { width: number; height: number } = bitmap,
): Promise<string> {
  const resized = size.width !== bitmap.width || size.height !== bitmap.height;
  // Browsers show these natively and apply EXIF orientation to <img> and canvas drawing.
  if (format && format !== "heic" && !resized) return URL.createObjectURL(file);
  return URL.createObjectURL(await canvasBlob(bitmap, size.width, size.height));
}
