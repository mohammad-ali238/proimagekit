export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const hex2 = (value: number) => Math.round(value).toString(16).padStart(2, "0");

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`.toUpperCase();
}

export function hexToRgb(hex: string): Rgb | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

/** HSL with hue in degrees and saturation/lightness in percent, all rounded. */
export function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  let hue = 0;
  let saturation = 0;
  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return { h: Math.round(hue), s: Math.round(saturation * 100), l: Math.round(lightness * 100) };
}

export function formatRgb({ r, g, b }: Rgb): string {
  return `rgb(${r}, ${g}, ${b})`;
}

export function formatHsl(color: Rgb): string {
  const { h, s, l } = rgbToHsl(color);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/** Relative luminance check, used to pick readable text on a swatch. */
export function isLight({ r, g, b }: Rgb): boolean {
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

/**
 * Index nearest the median where the channel value changes, so pixels of the
 * same value always stay in the same bucket (a plain median split would mix
 * two flat colours into one averaged, non-existent colour).
 */
function splitIndex(sorted: [number, number, number][], channel: number): number {
  const middle = Math.floor(sorted.length / 2);
  for (let offset = 0; offset < sorted.length; offset++) {
    for (const index of [middle + offset, middle - offset]) {
      if (index > 0 && index < sorted.length && sorted[index - 1][channel] !== sorted[index][channel]) return index;
    }
  }
  return middle;
}

/**
 * Extracts the dominant colours with median cut: the pixel set is split
 * along its widest channel until there are `count` buckets; each bucket's
 * average is a palette colour. Transparent pixels are ignored. Results are
 * ordered by how many pixels they represent.
 * @param data RGBA pixels (e.g. from a downscaled ImageData)
 */
export function extractPalette(data: Uint8ClampedArray | Uint8Array, count = 6): Rgb[] {
  const pixels: [number, number, number][] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] >= 128) pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (pixels.length === 0) return [];

  let buckets = [pixels];
  while (buckets.length < count) {
    let widest = -1;
    let widestRange = 0;
    let channel = 0;
    buckets.forEach((bucket, index) => {
      if (bucket.length < 2) return;
      for (let c = 0; c < 3; c++) {
        let min = 255;
        let max = 0;
        for (const pixel of bucket) {
          if (pixel[c] < min) min = pixel[c];
          if (pixel[c] > max) max = pixel[c];
        }
        if (max - min > widestRange) {
          widestRange = max - min;
          widest = index;
          channel = c;
        }
      }
    });
    if (widest === -1) break; // every bucket is a single colour
    const bucket = buckets[widest].sort((a, b) => a[channel] - b[channel]);
    const split = splitIndex(bucket, channel);
    buckets = [...buckets.slice(0, widest), bucket.slice(0, split), bucket.slice(split), ...buckets.slice(widest + 1)];
  }

  return buckets
    .sort((a, b) => b.length - a.length)
    .map((bucket) => {
      const sum = bucket.reduce((total, pixel) => [total[0] + pixel[0], total[1] + pixel[1], total[2] + pixel[2]], [0, 0, 0]);
      return { r: Math.round(sum[0] / bucket.length), g: Math.round(sum[1] / bucket.length), b: Math.round(sum[2] / bucket.length) };
    });
}
