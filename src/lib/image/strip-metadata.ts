/**
 * Lossless metadata removal: the file's structure is rewritten without its
 * metadata blocks, but the compressed image data is copied byte for byte.
 * Colour profiles and data needed to display the image correctly are kept.
 */

export interface StripResult {
  bytes: Uint8Array;
  /** Human-readable names of the metadata blocks that were removed. */
  removed: string[];
}

export class UnsupportedStructureError extends Error {}

function startsWith(bytes: Uint8Array, offset: number, text: string): boolean {
  for (let i = 0; i < text.length; i++) if (bytes[offset + i] !== text.charCodeAt(i)) return false;
  return true;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

// ---------------------------------------------------------------- JPEG

function jpegSegmentLabel(marker: number, bytes: Uint8Array, dataStart: number): string | null {
  if (marker === 0xe1) {
    if (startsWith(bytes, dataStart, "Exif\0")) return "EXIF";
    if (startsWith(bytes, dataStart, "http://ns.adobe.com/")) return "XMP";
    return "APP1 data";
  }
  if (marker === 0xed) return "IPTC";
  if (marker === 0xfe) return "Comment";
  if (marker === 0xe2 && startsWith(bytes, dataStart, "MPF\0")) return "Embedded previews";
  // Keep JFIF (APP0), ICC colour profiles (APP2) and Adobe colour info (APP14).
  if (marker === 0xe0 || marker === 0xe2 || marker === 0xee) return null;
  if (marker >= 0xe3 && marker <= 0xef) return `APP${marker - 0xe0} data`;
  return null;
}

/**
 * Removes EXIF, XMP, IPTC, comments and other application segments, and
 * anything appended after the end of the image (e.g. embedded previews).
 */
export function stripJpeg(bytes: Uint8Array): StripResult {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new UnsupportedStructureError("Not a JPEG file.");
  const parts: Uint8Array[] = [bytes.subarray(0, 2)];
  const removed = new Set<string>();
  let pos = 2;

  while (pos < bytes.length) {
    if (bytes[pos] !== 0xff) throw new UnsupportedStructureError("Unexpected data in JPEG.");
    let markerPos = pos;
    while (bytes[markerPos + 1] === 0xff) markerPos++; // fill bytes
    const marker = bytes[markerPos + 1];

    if (marker === 0xd9) {
      parts.push(bytes.subarray(markerPos, markerPos + 2));
      if (markerPos + 2 < bytes.length) removed.add("Data after the image");
      return { bytes: concat(parts), removed: [...removed] };
    }
    // Standalone markers have no length.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      parts.push(bytes.subarray(markerPos, markerPos + 2));
      pos = markerPos + 2;
      continue;
    }

    const length = (bytes[markerPos + 2] << 8) | bytes[markerPos + 3];
    const end = markerPos + 2 + length;
    if (length < 2 || end > bytes.length) throw new UnsupportedStructureError("Damaged JPEG segment.");

    if (marker === 0xda) {
      // Start of scan: copy the header and the entropy-coded data up to the next real marker.
      let scanEnd = end;
      while (scanEnd < bytes.length - 1) {
        if (bytes[scanEnd] === 0xff) {
          const next = bytes[scanEnd + 1];
          if (next !== 0x00 && !(next >= 0xd0 && next <= 0xd7) && next !== 0xff) break;
        }
        scanEnd++;
      }
      parts.push(bytes.subarray(markerPos, scanEnd));
      pos = scanEnd;
      continue;
    }

    const label = jpegSegmentLabel(marker, bytes, markerPos + 4);
    if (label) removed.add(label);
    else parts.push(bytes.subarray(markerPos, end));
    pos = end;
  }

  throw new UnsupportedStructureError("JPEG has no end marker.");
}

// ---------------------------------------------------------------- PNG

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// Everything needed to display the image (including colour and animation data).
const PNG_KEEP = new Set([
  "IHDR", "PLTE", "IDAT", "IEND", "tRNS", "gAMA", "cHRM", "sRGB", "iCCP", "sBIT", "bKGD", "pHYs",
  "cICP", "mDCv", "cLLi", "acTL", "fcTL", "fdAT",
]);

const PNG_LABELS: Record<string, string> = {
  tEXt: "Text", zTXt: "Text", iTXt: "Text / XMP", eXIf: "EXIF", tIME: "Modification time",
};

export function stripPng(bytes: Uint8Array): StripResult {
  if (!PNG_SIGNATURE.every((value, index) => bytes[index] === value)) throw new UnsupportedStructureError("Not a PNG file.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const parts: Uint8Array[] = [bytes.subarray(0, 8)];
  const removed = new Set<string>();
  let pos = 8;

  while (pos + 8 <= bytes.length) {
    const length = view.getUint32(pos);
    const type = String.fromCharCode(...bytes.subarray(pos + 4, pos + 8));
    const end = pos + 12 + length;
    if (end > bytes.length) throw new UnsupportedStructureError("Damaged PNG chunk.");
    if (PNG_KEEP.has(type)) parts.push(bytes.subarray(pos, end));
    else removed.add(PNG_LABELS[type] ?? `${type} data`);
    pos = end;
    if (type === "IEND") break;
  }
  if (pos < bytes.length) removed.add("Data after the image");
  return { bytes: concat(parts), removed: [...removed] };
}

// ---------------------------------------------------------------- WebP

const WEBP_FLAG_EXIF = 0x08;
const WEBP_FLAG_XMP = 0x04;

export function stripWebp(bytes: Uint8Array): StripResult {
  if (!startsWith(bytes, 0, "RIFF") || !startsWith(bytes, 8, "WEBP")) throw new UnsupportedStructureError("Not a WebP file.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const riffEnd = Math.min(bytes.length, 8 + view.getUint32(4, true));
  const chunks: Uint8Array[] = [];
  const removed = new Set<string>();
  let pos = 12;

  while (pos + 8 <= riffEnd) {
    const type = String.fromCharCode(...bytes.subarray(pos, pos + 4));
    const size = view.getUint32(pos + 4, true);
    const end = pos + 8 + size + (size % 2); // chunks are padded to even sizes
    if (pos + 8 + size > riffEnd) throw new UnsupportedStructureError("Damaged WebP chunk.");
    if (type === "EXIF") removed.add("EXIF");
    else if (type === "XMP ") removed.add("XMP");
    else chunks.push(bytes.slice(pos, Math.min(end, riffEnd)));
    pos = end;
  }

  // Clear the "has EXIF / XMP" flags in the extended header.
  const vp8x = chunks.find((chunk) => startsWith(chunk, 0, "VP8X"));
  if (vp8x) vp8x[8] &= ~(WEBP_FLAG_EXIF | WEBP_FLAG_XMP);

  const header = new Uint8Array(12);
  header.set(bytes.subarray(0, 12));
  const body = concat(chunks);
  new DataView(header.buffer).setUint32(4, 4 + body.length, true);
  return { bytes: concat([header, body]), removed: [...removed] };
}
