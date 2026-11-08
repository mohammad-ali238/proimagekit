"use client";

import { useMemo, useState } from "react";
import { BatchWorkspace } from "@/components/tools/batch/batch-workspace";
import { OutputFormatSelect, type OutputFormatChoice } from "@/components/tools/output-format-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImageQueue } from "@/hooks/use-image-queue";
import { parseDimension } from "@/lib/format";
import { acceptFor, formatList } from "@/lib/image/formats";
import { sizePresets } from "@/lib/image/presets";
import type { FitMode } from "@/lib/image/resize";
import { resizeImage, type ResizeOptions } from "@/lib/image/resize-image";

const accept = acceptFor("any");

interface ResizerState {
  mode: "dimensions" | "percent";
  width: number | null;
  height: number | null;
  keepAspect: boolean;
  fit: FitMode;
  percent: number;
  format: OutputFormatChoice;
  background: string;
}

const fitItems: { value: FitMode; label: string; description: string }[] = [
  { value: "cover", label: "Crop to fill", description: "Fills the exact size and trims the edges." },
  { value: "contain", label: "Fit inside", description: "Shows the whole image and pads the rest with the background colour." },
  { value: "stretch", label: "Stretch", description: "Fills the exact size and distorts the image." },
];

const presetItems = sizePresets.map((preset) => ({
  value: preset.id,
  label: `${preset.platform} ${preset.label} (${preset.width} × ${preset.height})`,
}));

const platforms = [...new Set(sizePresets.map((preset) => preset.platform))];

export default function ResizerTool() {
  const [state, setState] = useState<ResizerState>({
    mode: "dimensions",
    width: null,
    height: null,
    keepAspect: true,
    fit: "cover",
    percent: 50,
    format: "original",
    background: "#ffffff",
  });

  const options = useMemo<ResizeOptions>(
    () => ({
      spec:
        state.mode === "percent"
          ? { mode: "percent", percent: state.percent }
          : { mode: "dimensions", width: state.width, height: state.height, keepAspect: state.keepAspect, fit: state.fit },
      format: state.format,
      background: state.background,
    }),
    [state],
  );

  const queue = useImageQueue(options, resizeImage);
  const update = (patch: Partial<ResizerState>) => setState((current) => ({ ...current, ...patch }));

  // With the lock on, typing one side fills in the other from the first image's shape.
  const first = queue.items.find((item) => item.result)?.result;
  const aspect = first ? first.originalWidth / first.originalHeight : null;

  const setWidth = (width: number | null) =>
    update(state.keepAspect && aspect && width ? { width, height: Math.round(width / aspect) } : { width });
  const setHeight = (height: number | null) =>
    update(state.keepAspect && aspect && height ? { height, width: Math.round(height * aspect) } : { height });

  const activePreset = sizePresets.find(
    (preset) => !state.keepAspect && preset.width === state.width && preset.height === state.height,
  );
  const showFit = state.mode === "dimensions" && !state.keepAspect && !!state.width && !!state.height;

  return (
    <div className="space-y-4">
      <div className="space-y-5 rounded-xl border bg-card p-4">
        <Tabs value={state.mode} onValueChange={(mode) => update({ mode: mode as ResizerState["mode"] })}>
          <TabsList>
            <TabsTrigger value="dimensions">By size</TabsTrigger>
            <TabsTrigger value="percent">By percentage</TabsTrigger>
          </TabsList>

          <TabsContent value="dimensions" className="mt-4 grid gap-5 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="resize-width">Width (px)</Label>
                  <Input
                    id="resize-width"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="Auto"
                    value={state.width ?? ""}
                    onChange={(event) => setWidth(parseDimension(event.target.value))}
                  />
                </div>
                <span className="pb-2 text-muted-foreground" aria-hidden>
                  ×
                </span>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="resize-height">Height (px)</Label>
                  <Input
                    id="resize-height"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="Auto"
                    value={state.height ?? ""}
                    onChange={(event) => setHeight(parseDimension(event.target.value))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="keep-aspect"
                  checked={state.keepAspect}
                  onCheckedChange={(keepAspect) => update({ keepAspect })}
                />
                <Label htmlFor="keep-aspect">Keep aspect ratio</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {state.keepAspect
                  ? "Images are scaled to fit inside the size you enter, without distortion. Leave a side empty to set it automatically."
                  : "Images are made exactly this size."}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="size-preset">Social media preset</Label>
                <Select
                  items={presetItems}
                  value={activePreset?.id ?? null}
                  onValueChange={(id) => {
                    const preset = sizePresets.find((entry) => entry.id === id);
                    if (preset) update({ width: preset.width, height: preset.height, keepAspect: false, fit: "cover" });
                  }}
                >
                  <SelectTrigger id="size-preset" className="w-full">
                    <SelectValue placeholder="Choose a preset…" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectGroup key={platform}>
                        <SelectLabel>{platform}</SelectLabel>
                        {sizePresets
                          .filter((preset) => preset.platform === platform)
                          .map((preset) => (
                            <SelectItem key={preset.id} value={preset.id}>
                              {preset.label} · {preset.width} × {preset.height}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showFit && (
                <div className="space-y-2">
                  <Label htmlFor="fit-mode">If the shape doesn&apos;t match</Label>
                  <Select items={fitItems} value={state.fit} onValueChange={(fit) => fit && update({ fit: fit as FitMode })}>
                    <SelectTrigger id="fit-mode" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fitItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{fitItems.find((item) => item.value === state.fit)?.description}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="percent" className="mt-4 max-w-md space-y-3">
            <div className="flex items-center justify-between">
              <Label>Scale</Label>
              <span className="text-sm tabular-nums text-muted-foreground">{state.percent}%</span>
            </div>
            <Slider
              min={5}
              max={400}
              step={5}
              value={[state.percent]}
              thumbLabel="Scale percentage"
              onValueChange={(value) => update({ percent: Array.isArray(value) ? value[0] : value })}
            />
            <p className="text-xs text-muted-foreground">Below 100% makes images smaller; above 100% enlarges them.</p>
          </TabsContent>
        </Tabs>

        <div className="grid gap-5 border-t pt-4 sm:grid-cols-2">
          <OutputFormatSelect value={state.format} onChange={(format) => update({ format })} />
          <div className="space-y-2">
            <Label htmlFor="resize-background">Background colour</Label>
            <div className="flex items-center gap-2">
              <input
                id="resize-background"
                type="color"
                value={state.background}
                onChange={(event) => update({ background: event.target.value })}
                className="h-8 w-12 cursor-pointer rounded-md border bg-transparent p-0.5"
              />
              <span className="font-mono text-sm uppercase text-muted-foreground">{state.background}</span>
            </div>
            <p className="text-xs text-muted-foreground">Used for padding and for JPG, which can&apos;t store transparency.</p>
          </div>
        </div>
      </div>

      <BatchWorkspace
        queue={queue}
        accept={accept}
        formatsLabel={formatList("any")}
        verb={{ active: "Resizing", past: "resized" }}
        zipName="resized-images.zip"
      />
    </div>
  );
}
