import type { ImageFormat } from "@/lib/tools-registry";

export interface FormatInfo {
  label: string;
  mime: string;
  extension: string;
  /** Extra file extensions accepted as input. */
  aliases: string[];
  lossy: boolean;
  transparency: boolean;
  /** Formats the site can write. */
  encodable: boolean;
}

export const formatInfo: Record<ImageFormat, FormatInfo> = {
  jpeg: { label: "JPG", mime: "image/jpeg", extension: "jpg", aliases: ["jpeg", "jfif"], lossy: true, transparency: false, encodable: true },
  png: { label: "PNG", mime: "image/png", extension: "png", aliases: [], lossy: false, transparency: true, encodable: true },
  webp: { label: "WebP", mime: "image/webp", extension: "webp", aliases: [], lossy: true, transparency: true, encodable: true },
  avif: { label: "AVIF", mime: "image/avif", extension: "avif", aliases: [], lossy: true, transparency: true, encodable: true },
  heic: { label: "HEIC", mime: "image/heic", extension: "heic", aliases: ["heif"], lossy: true, transparency: true, encodable: false },
  gif: { label: "GIF", mime: "image/gif", extension: "gif", aliases: [], lossy: false, transparency: true, encodable: false },
  bmp: { label: "BMP", mime: "image/bmp", extension: "bmp", aliases: [], lossy: false, transparency: false, encodable: false },
};

export const decodableFormats = Object.keys(formatInfo) as ImageFormat[];
export const encodableFormats = decodableFormats.filter((format) => formatInfo[format].encodable);

const extraMimes: Partial<Record<ImageFormat, string[]>> = {
  heic: ["image/heif", "image/heic-sequence", "image/heif-sequence"],
  bmp: ["image/x-ms-bmp"],
};

/** Accept map in the shape react-dropzone expects: MIME type → extensions. */
export function acceptFor(formats: ImageFormat[] | "any"): Record<string, string[]> {
  const list = formats === "any" ? decodableFormats : formats;
  const accept: Record<string, string[]> = {};
  for (const format of list) {
    const info = formatInfo[format];
    const extensions = [info.extension, ...info.aliases].map((ext) => `.${ext}`);
    for (const mime of [info.mime, ...(extraMimes[format] ?? [])]) accept[mime] = extensions;
  }
  return accept;
}

/** Human-readable list such as "JPG, PNG or WebP". */
export function formatList(formats: ImageFormat[] | "any"): string {
  const labels = (formats === "any" ? decodableFormats : formats).map((format) => formatInfo[format].label);
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} or ${labels.at(-1)}`;
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

/**
 * Detects the real format from the file's first bytes. File extensions and
 * MIME types are unreliable (e.g. Windows reports HEIC files with no type).
 */
export function sniffFormat(bytes: Uint8Array): ImageFormat | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes[0] === 0x89 && ascii(bytes, 1, 3) === "PNG") return "png";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "webp";
  if (ascii(bytes, 0, 4) === "GIF8") return "gif";
  if (ascii(bytes, 0, 2) === "BM") return "bmp";
  if (ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4);
    if (brand === "avif" || brand === "avis") return "avif";
    if (["heic", "heix", "heim", "heis", "hevc", "hevx", "mif1", "msf1"].includes(brand)) return "heic";
  }
  return null;
}

export async function detectFormat(file: Blob): Promise<ImageFormat | null> {
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  return sniffFormat(bytes);
}

/** Replaces the extension, e.g. ("IMG_01.HEIC", "jpeg") → "IMG_01.jpg". */
export function renameForFormat(fileName: string, format: ImageFormat): string {
  const base = fileName.replace(/\.[^./\\]+$/, "") || "image";
  return `${base}.${formatInfo[format].extension}`;
}

/**
 * Output format for tools with a "keep original format" option. Formats the
 * site can't write fall back: GIF and BMP become PNG, HEIC becomes JPG.
 */
export function resolveOutputFormat(input: ImageFormat | null, choice: ImageFormat | "original"): ImageFormat {
  if (choice !== "original") return choice;
  if (input && formatInfo[input].encodable) return input;
  if (input === "gif" || input === "bmp") return "png";
  return "jpeg";
}
