import type { ImageFormat } from "@/lib/tools-registry";
import { encodeWithWasm } from "@/lib/workers/codec-client";
import type { WasmFormat } from "@/lib/workers/codec-protocol";
import { formatInfo } from "./formats";

export type Canvas2D = OffscreenCanvas | HTMLCanvasElement;
export type Context2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

/**
 * "native" uses the browser's built-in encoders (fast); "wasm" uses MozJPEG,
 * OxiPNG, libwebp and libavif in a worker (slower, noticeably smaller files).
 */
export type EncodeEngine = "native" | "wasm";

export function createCanvas(width: number, height: number): Canvas2D {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function getContext(canvas: Canvas2D): Context2D {
  const context = canvas.getContext("2d") as Context2D | null;
  if (!context) throw new Error("Your browser couldn't create a drawing canvas.");
  return context;
}

function canvasToBlob(canvas: Canvas2D, type: string, quality?: number): Promise<Blob> {
  if ("convertToBlob" in canvas) return canvas.convertToBlob({ type, quality });
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Encoding failed."))), type, quality),
  );
}

function isWasmFormat(format: ImageFormat): format is WasmFormat {
  return format === "jpeg" || format === "png" || format === "webp" || format === "avif";
}

/**
 * Encodes a canvas. With the native engine, JPG/PNG/WebP use the browser's
 * encoder (browsers without WebP encoding silently return PNG, which we detect
 * and fall back from); AVIF always goes through the WebAssembly worker.
 * @param quality 0–100, ignored for PNG.
 */
export async function encodeCanvas(
  canvas: Canvas2D,
  format: ImageFormat,
  quality: number,
  engine: EncodeEngine = "native",
): Promise<Blob> {
  const { mime, label } = formatInfo[format];
  if (!isWasmFormat(format)) throw new Error(`Saving as ${label} isn't supported.`);

  if (engine === "native" && format !== "avif") {
    const blob = await canvasToBlob(canvas, mime, format === "png" ? undefined : quality / 100);
    if (blob.type === mime) return blob;
    if (format !== "webp") throw new Error(`Your browser can't save ${label} files.`);
  }

  const image = getContext(canvas).getImageData(0, 0, canvas.width, canvas.height);
  const buffer = await encodeWithWasm(format, image, quality);
  return new Blob([buffer], { type: mime });
}
