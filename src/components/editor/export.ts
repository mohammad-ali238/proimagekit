import type Konva from "konva";
import type { EditorDocument } from "@/lib/editor/document";
import { createCanvas, encodeCanvas, getContext } from "@/lib/image/encode";
import { formatInfo } from "@/lib/image/formats";
import type { ImageFormat } from "@/lib/tools-registry";

export type ExportFormat = Extract<ImageFormat, "png" | "jpeg" | "webp" | "avif">;
export const exportFormats: ExportFormat[] = ["png", "jpeg", "webp", "avif"];

/**
 * Renders the content layer (never the selection handles or crop overlay) at
 * the document's full resolution, whatever the current zoom, and encodes it.
 */
export async function exportDocument(
  layer: Konva.Layer,
  doc: EditorDocument,
  zoom: number,
  format: ExportFormat,
  quality = 92,
): Promise<Blob> {
  const rendered = layer.toCanvas({
    x: 0,
    y: 0,
    width: doc.width * zoom,
    height: doc.height * zoom,
    pixelRatio: 1 / zoom,
  });

  const canvas = createCanvas(doc.width, doc.height);
  const context = getContext(canvas);
  if (!formatInfo[format].transparency) {
    context.fillStyle = doc.background ?? "#ffffff";
    context.fillRect(0, 0, doc.width, doc.height);
  }
  context.drawImage(rendered, 0, 0, doc.width, doc.height);
  return encodeCanvas(canvas, format, quality);
}
