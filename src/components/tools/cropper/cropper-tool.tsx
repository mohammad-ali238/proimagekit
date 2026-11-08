"use client";

import { useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Download, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { OutputFormatSelect, type OutputFormatChoice } from "@/components/tools/output-format-select";
import { SingleImagePicker } from "@/components/tools/single-image-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSingleImage } from "@/hooks/use-single-image";
import { downloadBlob } from "@/lib/download";
import { formatDimensions } from "@/lib/format";
import { cropBitmap, percentToPixels } from "@/lib/image/crop";
import { renameForFormat, resolveOutputFormat } from "@/lib/image/formats";
import { cn } from "@/lib/utils";

const aspectPresets: { label: string; value: number | "original" | null }[] = [
  { label: "Free", value: null },
  { label: "Original", value: "original" },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "16:9", value: 16 / 9 },
  { label: "4:5", value: 4 / 5 },
  { label: "9:16", value: 9 / 16 },
];

const fullCrop: PercentCrop = { unit: "%", x: 0, y: 0, width: 100, height: 100 };

function centredCrop(aspect: number, width: number, height: number): PercentCrop {
  return centerCrop(makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height), width, height);
}

export default function CropperTool() {
  const { image, load, clear, loading, error } = useSingleImage();
  const [preset, setPreset] = useState<(typeof aspectPresets)[number]["value"]>(null);
  const [crop, setCrop] = useState<PercentCrop>(fullCrop);
  const [format, setFormat] = useState<OutputFormatChoice>("original");
  const [saving, setSaving] = useState(false);

  if (!image) {
    return (
      <SingleImagePicker
        onFile={(file) => {
          setCrop(fullCrop);
          setPreset(null);
          void load(file);
        }}
        loading={loading}
        error={error}
      />
    );
  }

  const aspect = preset === "original" ? image.width / image.height : (preset ?? undefined);
  const pixels = percentToPixels(crop, image.width, image.height);

  const choosePreset = (value: (typeof aspectPresets)[number]["value"]) => {
    setPreset(value);
    const ratio = value === "original" ? image.width / image.height : value;
    if (ratio) setCrop(centredCrop(ratio, image.width, image.height));
  };

  const save = async () => {
    setSaving(true);
    try {
      const output = resolveOutputFormat(image.format, format);
      const blob = await cropBitmap(image.bitmap, pixels, output);
      downloadBlob(blob, renameForFormat(image.file.name, output).replace(/(\.[^.]+)$/, "-cropped$1"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Couldn't crop this image.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border bg-card p-4">
        <Label id="aspect-label">Aspect ratio</Label>
        <div role="radiogroup" aria-labelledby="aspect-label" className="flex flex-wrap gap-2">
          {aspectPresets.map((option) => (
            <Button
              key={option.label}
              role="radio"
              aria-checked={preset === option.value}
              variant="outline"
              size="sm"
              className={cn(preset === option.value && "border-primary bg-primary/10 text-primary")}
              onClick={() => choosePreset(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex justify-center rounded-xl border bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:20px_20px] p-2">
        <ReactCrop
          crop={crop}
          aspect={aspect}
          keepSelection
          ruleOfThirds
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          className="max-w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL */}
          <img src={image.url} alt={`Cropping ${image.file.name}`} className="max-h-[65vh] max-w-full" />
        </ReactCrop>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-card p-4">
        <div className="text-sm">
          <p className="text-muted-foreground">Crop size</p>
          <p className="font-medium tabular-nums" data-testid="crop-size">
            {formatDimensions(pixels.width, pixels.height)} px
          </p>
        </div>
        <div className="w-48">
          <OutputFormatSelect value={format} onChange={setFormat} />
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" onClick={clear}>
            <ImagePlus /> Other image
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Download />} Download cropped image
          </Button>
        </div>
      </div>
    </div>
  );
}
