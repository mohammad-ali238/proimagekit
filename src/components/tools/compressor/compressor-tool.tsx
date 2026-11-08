"use client";

import { useState } from "react";
import { BatchWorkspace } from "@/components/tools/batch/batch-workspace";
import { OutputFormatSelect } from "@/components/tools/output-format-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useImageQueue } from "@/hooks/use-image-queue";
import { parseDimension } from "@/lib/format";
import { compressImage, type CompressOptions } from "@/lib/image/compress";
import { acceptFor, formatList } from "@/lib/image/formats";

const accept = acceptFor("any");

export default function CompressorTool() {
  const [options, setOptions] = useState<CompressOptions>({ format: "original", quality: 75, maxWidth: null, maxHeight: null });
  const queue = useImageQueue(options, compressImage);
  const update = (patch: Partial<CompressOptions>) => setOptions((current) => ({ ...current, ...patch }));
  const pngOnly = options.format === "png";

  return (
    <div className="space-y-4">
      <div className="grid gap-5 rounded-xl border bg-card p-4 sm:grid-cols-3">
        <OutputFormatSelect value={options.format} onChange={(format) => update({ format })} />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Quality</Label>
            <span className="text-sm tabular-nums text-muted-foreground">{pngOnly ? "Lossless" : options.quality}</span>
          </div>
          <Slider
            min={10}
            max={100}
            step={1}
            value={[options.quality]}
            disabled={pngOnly}
            thumbLabel="Quality"
            onValueChange={(value) => update({ quality: Array.isArray(value) ? value[0] : value })}
          />
          <p className="text-xs text-muted-foreground">
            {pngOnly
              ? "PNG is optimised losslessly — every pixel stays the same."
              : "70–80 is usually indistinguishable from the original. PNGs are optimised losslessly."}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Maximum size (optional)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="Width"
              aria-label="Maximum width in pixels"
              value={options.maxWidth ?? ""}
              onChange={(event) => update({ maxWidth: parseDimension(event.target.value) })}
            />
            <span className="text-muted-foreground" aria-hidden>
              ×
            </span>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="Height"
              aria-label="Maximum height in pixels"
              value={options.maxHeight ?? ""}
              onChange={(event) => update({ maxHeight: parseDimension(event.target.value) })}
            />
          </div>
          <p className="text-xs text-muted-foreground">Larger images are scaled down to fit. Smaller ones are left as they are.</p>
        </div>
      </div>

      <BatchWorkspace
        queue={queue}
        accept={accept}
        formatsLabel={formatList("any")}
        verb={{ active: "Compressing", past: "compressed" }}
        zipName="compressed-images.zip"
        compare
      />
    </div>
  );
}
