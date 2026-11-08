"use client";

import { useState } from "react";
import { FlipHorizontal2, FlipVertical2, RotateCcw, RotateCw, Undo2 } from "lucide-react";
import { BatchWorkspace } from "@/components/tools/batch/batch-workspace";
import { OutputFormatSelect } from "@/components/tools/output-format-select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useImageQueue } from "@/hooks/use-image-queue";
import { acceptFor, formatList } from "@/lib/image/formats";
import { transformImage, type Rotation, type TransformOptions } from "@/lib/image/transform";

const accept = acceptFor("any");

export default function RotatorTool() {
  const [options, setOptions] = useState<TransformOptions>({
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    format: "original",
  });
  const queue = useImageQueue(options, transformImage);
  const update = (patch: Partial<TransformOptions>) => setOptions((current) => ({ ...current, ...patch }));
  const rotate = (degrees: number) => update({ rotation: (((options.rotation + degrees) % 360) + 360) % 360 as Rotation });

  const summary = [
    options.rotation ? `Rotated ${options.rotation}°` : null,
    options.flipHorizontal ? "flipped horizontally" : null,
    options.flipVertical ? "flipped vertically" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-4">
      <div className="grid gap-5 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_16rem]">
        <div className="space-y-2">
          <Label>Rotate & flip</Label>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => rotate(-90)}>
              <RotateCcw /> Rotate left
            </Button>
            <Button variant="outline" onClick={() => rotate(90)}>
              <RotateCw /> Rotate right
            </Button>
            <Button variant="outline" onClick={() => rotate(180)}>
              180°
            </Button>
            <Button
              variant="outline"
              aria-pressed={options.flipHorizontal}
              className="aria-pressed:bg-primary/10 aria-pressed:text-primary"
              onClick={() => update({ flipHorizontal: !options.flipHorizontal })}
            >
              <FlipHorizontal2 /> Flip horizontal
            </Button>
            <Button
              variant="outline"
              aria-pressed={options.flipVertical}
              className="aria-pressed:bg-primary/10 aria-pressed:text-primary"
              onClick={() => update({ flipVertical: !options.flipVertical })}
            >
              <FlipVertical2 /> Flip vertical
            </Button>
            <Button
              variant="ghost"
              onClick={() => update({ rotation: 0, flipHorizontal: false, flipVertical: false })}
              disabled={!summary}
            >
              <Undo2 /> Reset
            </Button>
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {summary ? `${summary[0].toUpperCase()}${summary.slice(1)}.` : "No changes yet."} Applied to every image.
          </p>
        </div>
        <OutputFormatSelect value={options.format} onChange={(format) => update({ format })} />
      </div>

      <BatchWorkspace
        queue={queue}
        accept={accept}
        formatsLabel={formatList("any")}
        verb={{ active: "Rotating", past: "done" }}
        zipName="rotated-images.zip"
        livePreview
      />
    </div>
  );
}
