/**
 * The quality sliders go up to 100, but encoding never uses more than this.
 * Higher settings are shown to the user as chosen and encoded at this value.
 */
export const MAX_ENCODE_QUALITY = 80;

/** Quality actually passed to the encoder for a slider value (0–100). */
export function encodingQuality(requested: number): number {
  return Math.min(Math.max(requested, 0), MAX_ENCODE_QUALITY);
}
