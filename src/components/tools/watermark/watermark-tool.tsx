"use client";

import { useState } from "react";
import { Grid3x3, ImageIcon, Type, X } from "lucide-react";
import { BatchWorkspace } from "@/components/tools/batch/batch-workspace";
import { OutputFormatSelect } from "@/components/tools/output-format-select";
import { SliderField } from "@/components/tools/slider-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImageQueue } from "@/hooks/use-image-queue";
import { acceptFor, formatList } from "@/lib/image/formats";
import { cn } from "@/lib/utils";
import { watermarkImage, watermarkPositions, type WatermarkOptions, type WatermarkPosition } from "@/lib/image/watermark";

const accept = acceptFor("any");
const logoAccept = acceptFor(["png", "webp", "jpeg", "avif"]);

const positionLabels: Record<(typeof watermarkPositions)[number], string> = {
  "top-left": "Top left",
  "top-center": "Top centre",
  "top-right": "Top right",
  "middle-left": "Middle left",
  center: "Centre",
  "middle-right": "Middle right",
  "bottom-left": "Bottom left",
  "bottom-center": "Bottom centre",
  "bottom-right": "Bottom right",
};

export default function WatermarkTool() {
  const [options, setOptions] = useState<WatermarkOptions>({
    kind: "text",
    text: "© Your Name",
    color: "#ffffff",
    textSize: 5,
    logo: null,
    logoSize: 20,
    opacity: 60,
    rotation: 0,
    position: "bottom-right",
    margin: 3,
    format: "original",
  });
  const queue = useImageQueue(options, watermarkImage);
  const update = (patch: Partial<WatermarkOptions>) => setOptions((current) => ({ ...current, ...patch }));

  const pickLogo = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = Object.entries(logoAccept)
      .flatMap(([mime, extensions]) => [mime, ...extensions])
      .join(",");
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) update({ logo: file, kind: "image" });
    };
    input.click();
  };

  const setPosition = (position: WatermarkPosition) => update({ position });

  return (
    <div className="space-y-4">
      <div className="grid gap-6 rounded-xl border bg-card p-4 md:grid-cols-2">
        <div className="space-y-4">
          <Tabs value={options.kind} onValueChange={(kind) => update({ kind: kind as WatermarkOptions["kind"] })}>
            <TabsList>
              <TabsTrigger value="text">
                <Type /> Text
              </TabsTrigger>
              <TabsTrigger value="image">
                <ImageIcon /> Logo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="watermark-text">Watermark text</Label>
                <Input id="watermark-text" value={options.text} maxLength={120} onChange={(event) => update({ text: event.target.value })} />
              </div>
              <div className="flex items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="watermark-color">Colour</Label>
                  <input
                    id="watermark-color"
                    type="color"
                    value={options.color}
                    onChange={(event) => update({ color: event.target.value })}
                    className="block h-8 w-12 cursor-pointer rounded-md border bg-transparent p-0.5"
                  />
                </div>
                <div className="flex-1">
                  <SliderField label="Text size" value={options.textSize} min={1} max={30} unit="%" onChange={(textSize) => update({ textSize })} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="image" className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={pickLogo}>
                  <ImageIcon /> {options.logo ? "Change logo" : "Choose logo"}
                </Button>
                {options.logo && (
                  <>
                    <span className="min-w-0 truncate text-sm text-muted-foreground">{options.logo.name}</span>
                    <Button variant="ghost" size="icon" aria-label="Remove logo" onClick={() => update({ logo: null })}>
                      <X />
                    </Button>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">A PNG with a transparent background works best.</p>
              <SliderField label="Logo size" value={options.logoSize} min={5} max={80} unit="%" onChange={(logoSize) => update({ logoSize })} />
            </TabsContent>
          </Tabs>

          <SliderField label="Opacity" value={options.opacity} min={5} max={100} unit="%" onChange={(opacity) => update({ opacity })} />
          <SliderField label="Rotation" value={options.rotation} min={-90} max={90} unit="°" onChange={(rotation) => update({ rotation })} />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label id="position-label">Position</Label>
            <div className="flex items-start gap-3">
              <div role="radiogroup" aria-labelledby="position-label" className="grid w-28 grid-cols-3 gap-1">
                {watermarkPositions.map((position) => (
                  <button
                    key={position}
                    type="button"
                    role="radio"
                    aria-checked={options.position === position}
                    aria-label={positionLabels[position]}
                    title={positionLabels[position]}
                    onClick={() => setPosition(position)}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-md border transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                      options.position === position && "border-primary bg-primary/10",
                    )}
                  >
                    <span className={cn("size-2 rounded-full bg-muted-foreground/50", options.position === position && "bg-primary")} />
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                aria-pressed={options.position === "tile"}
                className="aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary"
                onClick={() => setPosition("tile")}
              >
                <Grid3x3 /> Tile
              </Button>
            </div>
          </div>
          <SliderField label="Margin" value={options.margin} min={0} max={20} unit="%" onChange={(margin) => update({ margin })} />
          <OutputFormatSelect value={options.format} onChange={(format) => update({ format })} />
        </div>
      </div>

      <BatchWorkspace
        queue={queue}
        accept={accept}
        formatsLabel={formatList("any")}
        verb={{ active: "Adding watermark", past: "watermarked" }}
        zipName="watermarked-images.zip"
        livePreview
      />
    </div>
  );
}
