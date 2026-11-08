"use client";

import { useMemo, useRef, useState, type MouseEvent } from "react";
import { Copy, ImagePlus, Pipette } from "lucide-react";
import { toast } from "sonner";
import { SingleImagePicker } from "@/components/tools/single-image-picker";
import { Button } from "@/components/ui/button";
import { useSingleImage, type LoadedImage } from "@/hooks/use-single-image";
import { extractPalette, formatHsl, formatRgb, hexToRgb, isLight, rgbToHex, type Rgb } from "@/lib/image/color";
import { cn } from "@/lib/utils";

interface EyeDropperResult {
  sRGBHex: string;
}
declare global {
  interface Window {
    EyeDropper?: new () => { open: () => Promise<EyeDropperResult> };
  }
}

const HISTORY_LIMIT = 12;

function sameColor(a: Rgb, b: Rgb) {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

/** Reads single pixels from the full-resolution image through a reusable 1×1 canvas. */
function usePixelReader(image: LoadedImage | null) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  return (x: number, y: number): Rgb | null => {
    if (!image) return null;
    canvas.current ??= Object.assign(document.createElement("canvas"), { width: 1, height: 1 });
    const context = canvas.current.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.clearRect(0, 0, 1, 1);
    context.drawImage(image.bitmap, x, y, 1, 1, 0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    return { r, g, b };
  };
}

function usePalette(image: LoadedImage | null): Rgb[] {
  return useMemo(() => {
    if (!image) return [];
    const scale = Math.min(1, 120 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return [];
    context.drawImage(image.bitmap, 0, 0, canvas.width, canvas.height);
    return extractPalette(context.getImageData(0, 0, canvas.width, canvas.height).data, 8);
  }, [image]);
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`Copied ${text}`);
  } catch {
    toast.error("Couldn't copy — your browser blocked clipboard access.");
  }
}

function ColorValues({ color }: { color: Rgb }) {
  const values = [
    { label: "HEX", value: rgbToHex(color) },
    { label: "RGB", value: formatRgb(color) },
    { label: "HSL", value: formatHsl(color) },
  ];
  return (
    <dl className="space-y-1.5">
      {values.map(({ label, value }) => (
        <div key={label} className="flex items-center gap-2">
          <dt className="w-10 text-xs font-medium text-muted-foreground">{label}</dt>
          <dd className="flex-1 font-mono text-sm">{value}</dd>
          <Button variant="ghost" size="icon-sm" aria-label={`Copy ${label} ${value}`} onClick={() => copy(value)}>
            <Copy />
          </Button>
        </div>
      ))}
    </dl>
  );
}

function Swatch({ color, selected, onClick }: { color: Rgb; selected?: boolean; onClick: () => void }) {
  const hex = rgbToHex(color);
  return (
    <button
      type="button"
      onClick={onClick}
      title={hex}
      aria-label={`Select ${hex}`}
      className={cn(
        "size-9 rounded-md border shadow-sm transition-transform outline-none hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/50",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
      style={{ backgroundColor: hex }}
    />
  );
}

export default function ColorPickerTool() {
  const { image, load, clear, loading, error } = useSingleImage();
  const readPixel = usePixelReader(image);
  const palette = usePalette(image);
  const [picked, setPicked] = useState<Rgb | null>(null);
  const [hovered, setHovered] = useState<{ color: Rgb; x: number; y: number } | null>(null);
  const [history, setHistory] = useState<Rgb[]>([]);
  // This tool only renders in the browser (ssr: false), so window is always available.
  const hasEyeDropper = typeof window.EyeDropper === "function";

  const select = (color: Rgb) => {
    setPicked(color);
    setHistory((current) => [color, ...current.filter((entry) => !sameColor(entry, color))].slice(0, HISTORY_LIMIT));
  };

  const pointFromEvent = (event: MouseEvent<HTMLImageElement>) => {
    if (!image) return null;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(image.width - 1, Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * image.width)));
    const y = Math.min(image.height - 1, Math.max(0, Math.floor(((event.clientY - rect.top) / rect.height) * image.height)));
    return { x, y };
  };

  const openEyeDropper = async () => {
    if (!window.EyeDropper) return;
    try {
      const result = await new window.EyeDropper().open();
      const color = hexToRgb(result.sRGBHex);
      if (color) select(color);
    } catch {
      // The user pressed Escape.
    }
  };

  if (!image) return <SingleImagePicker onFile={(file) => void load(file)} loading={loading} error={error} />;


  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-2">
        <div className="flex justify-center rounded-xl border bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:20px_20px] p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL */}
          <img
            src={image.url}
            alt={`Click to pick a colour from ${image.file.name}`}
            className="max-h-[70vh] max-w-full cursor-crosshair"
            draggable={false}
            onMouseMove={(event) => {
              const point = pointFromEvent(event);
              const color = point && readPixel(point.x, point.y);
              setHovered(point && color ? { ...point, color } : null);
            }}
            onMouseLeave={() => setHovered(null)}
            onClick={(event) => {
              const point = pointFromEvent(event);
              const color = point && readPixel(point.x, point.y);
              if (color) select(color);
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {hovered ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-sm border" style={{ backgroundColor: rgbToHex(hovered.color) }} aria-hidden />
              <span className="font-mono">{rgbToHex(hovered.color)}</span> at pixel {hovered.x}, {hovered.y} · click to pick
            </span>
          ) : (
            "Hover over the image and click to pick a colour."
          )}
        </p>
      </div>

      <aside className="space-y-4">
        <section className="space-y-3 rounded-xl border bg-card p-4" aria-label="Selected colour">
          <div
            className={cn(
              "flex h-24 items-end rounded-lg border p-2 font-mono text-sm",
              picked && (isLight(picked) ? "text-black" : "text-white"),
            )}
            style={{ backgroundColor: picked ? rgbToHex(picked) : undefined }}
            data-testid="color-swatch"
          >
            {picked ? rgbToHex(picked) : <span className="text-muted-foreground">No colour picked yet</span>}
          </div>
          {picked && <ColorValues color={picked} />}
          <div className="flex flex-wrap gap-2">
            {hasEyeDropper && (
              <Button variant="outline" size="sm" onClick={openEyeDropper}>
                <Pipette /> Pick from screen
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={clear}>
              <ImagePlus /> Other image
            </Button>
          </div>
        </section>

        {palette.length > 0 && (
          <section className="space-y-2 rounded-xl border bg-card p-4">
            <h2 className="text-sm font-medium">Main colours</h2>
            <div className="flex flex-wrap gap-2">
              {palette.map((color) => (
                <Swatch key={rgbToHex(color)} color={color} selected={!!picked && sameColor(picked, color)} onClick={() => select(color)} />
              ))}
            </div>
          </section>
        )}

        {history.length > 0 && (
          <section className="space-y-2 rounded-xl border bg-card p-4">
            <h2 className="text-sm font-medium">Picked colours</h2>
            <div className="flex flex-wrap gap-2">
              {history.map((color) => (
                <Swatch key={rgbToHex(color)} color={color} selected={!!picked && sameColor(picked, color)} onClick={() => select(color)} />
              ))}
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}
