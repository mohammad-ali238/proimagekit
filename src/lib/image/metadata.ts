import type { ExpandedTags } from "exifreader";

export interface MetadataRow {
  label: string;
  value: string;
}

export interface MetadataGroup {
  id: string;
  title: string;
  rows: MetadataRow[];
}

export interface MetadataSummary {
  groups: MetadataGroup[];
  gps: { latitude: number; longitude: number; altitude?: number } | null;
  /** Privacy-sensitive items found, e.g. "GPS location", "Camera model". */
  sensitive: string[];
  orientation: number | null;
  /** Every tag, for the "All metadata" table. */
  all: MetadataGroup[];
}

/** Reads metadata from the file's bytes (never from a URL). ExifReader is loaded on demand. */
export async function readMetadata(file: Blob): Promise<ExpandedTags> {
  const { default: ExifReader } = await import("exifreader");
  try {
    return ExifReader.load(await file.arrayBuffer(), { expanded: true, includeUnknown: false });
  } catch {
    // ExifReader throws when a file has no metadata at all.
    return {};
  }
}

type TagRecord = Record<string, { description?: unknown; value?: unknown } | undefined>;

function describe(tag: { description?: unknown; value?: unknown } | undefined): string | null {
  if (!tag) return null;
  const value = tag.description ?? tag.value;
  if (value === undefined || value === null) return null;
  const text = Array.isArray(value) ? value.join(", ") : String(value);
  const trimmed = text.replace(/\0/g, "").trim();
  return trimmed && trimmed.length < 500 ? trimmed : null;
}

function pick(tags: TagRecord | undefined, fields: [string, string][]): MetadataRow[] {
  if (!tags) return [];
  return fields.flatMap(([key, label]) => {
    const value = describe(tags[key]);
    return value ? [{ label, value }] : [];
  });
}

const cameraFields: [string, string][] = [
  ["Make", "Make"],
  ["Model", "Model"],
  ["LensModel", "Lens"],
  ["BodySerialNumber", "Serial number"],
  ["Software", "Software"],
];

const captureFields: [string, string][] = [
  ["DateTimeOriginal", "Date taken"],
  ["ExposureTime", "Exposure"],
  ["FNumber", "Aperture"],
  ["ISOSpeedRatings", "ISO"],
  ["FocalLength", "Focal length"],
  ["Flash", "Flash"],
];

const imageFields: [string, string][] = [
  ["Orientation", "Orientation"],
  ["ColorSpace", "Colour space"],
  ["XResolution", "Horizontal resolution"],
  ["YResolution", "Vertical resolution"],
];

const authorFields: [string, string][] = [
  ["Artist", "Artist"],
  ["Copyright", "Copyright"],
  ["ImageDescription", "Description"],
  ["UserComment", "Comment"],
];

export function summarizeMetadata(tags: ExpandedTags): MetadataSummary {
  const exif = tags.exif as TagRecord | undefined;
  const gps =
    tags.gps && typeof tags.gps.Latitude === "number" && typeof tags.gps.Longitude === "number"
      ? { latitude: tags.gps.Latitude, longitude: tags.gps.Longitude, altitude: tags.gps.Altitude }
      : null;

  const groups: MetadataGroup[] = [
    { id: "camera", title: "Camera", rows: pick(exif, cameraFields) },
    { id: "capture", title: "Capture settings", rows: pick(exif, captureFields) },
    { id: "author", title: "Author & description", rows: [...pick(exif, authorFields), ...pick(tags.iptc as TagRecord, [["By-line", "Author"], ["Caption/Abstract", "Caption"], ["Keywords", "Keywords"]])] },
    { id: "image", title: "Image", rows: pick(exif, imageFields) },
  ].filter((group) => group.rows.length > 0);

  const sensitive: string[] = [];
  if (gps) sensitive.push("GPS location");
  if (describe(exif?.Make) || describe(exif?.Model)) sensitive.push("Camera model");
  if (describe(exif?.BodySerialNumber)) sensitive.push("Camera serial number");
  if (describe(exif?.DateTimeOriginal) || describe(exif?.DateTime)) sensitive.push("Date taken");
  if (groups.some((group) => group.id === "author")) sensitive.push("Author details");

  const all: MetadataGroup[] = (["exif", "iptc", "xmp", "icc", "file", "pngText", "riff"] as const)
    .map((key): MetadataGroup | null => {
      const record = tags[key] as TagRecord | undefined;
      if (!record) return null;
      const rows = Object.entries(record)
        .filter(([name]) => name !== "_raw")
        .flatMap(([name, tag]) => {
          const value = describe(tag);
          return value ? [{ label: name, value }] : [];
        });
      return rows.length ? { id: key, title: key.toUpperCase(), rows } : null;
    })
    .filter((group): group is MetadataGroup => group !== null);

  const orientationValue = (exif?.Orientation as { value?: unknown } | undefined)?.value;
  return {
    groups,
    gps,
    sensitive,
    orientation: typeof orientationValue === "number" ? orientationValue : null,
    all,
  };
}
