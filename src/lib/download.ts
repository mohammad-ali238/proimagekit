import { zip, type Zippable } from "fflate";

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser time to start the download before releasing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Makes names unique, e.g. photo.jpg, photo (2).jpg, photo (3).jpg. */
export function uniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const key = name.toLowerCase();
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count === 1) return name;
    const dot = name.lastIndexOf(".");
    return dot > 0 ? `${name.slice(0, dot)} (${count})${name.slice(dot)}` : `${name} (${count})`;
  });
}

/** Builds a ZIP in the browser. Images are already compressed, so files are stored without recompression. */
export async function createZip(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const names = uniqueNames(files.map((file) => file.name));
  const entries: Zippable = {};
  await Promise.all(
    files.map(async (file, index) => {
      entries[names[index]] = [new Uint8Array(await file.blob.arrayBuffer()), { level: 0 }];
    }),
  );
  const data = await new Promise<Uint8Array>((resolve, reject) =>
    zip(entries, (error, result) => (error ? reject(error) : resolve(result))),
  );
  return new Blob([data as Uint8Array<ArrayBuffer>], { type: "application/zip" });
}
