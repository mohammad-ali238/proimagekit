export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

/** Percentage change from `before` to `after`, rounded; negative means smaller. */
export function percentChange(before: number, after: number): number {
  if (before <= 0) return 0;
  return Math.round(((after - before) / before) * 100);
}

export function formatDimensions(width: number, height: number): string {
  return `${width} × ${height}`;
}

/** Parses a pixel-size field: empty or invalid means "not set"; capped at the canvas side limit. */
export function parseDimension(value: string, max = 16_384): number | null {
  const number = Math.round(Number(value));
  return value.trim() !== "" && Number.isFinite(number) && number > 0 ? Math.min(number, max) : null;
}
