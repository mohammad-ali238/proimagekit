"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { encodableFormats, formatInfo } from "@/lib/image/formats";
import type { ConvertOptions } from "@/lib/image/convert";
import type { ImageFormat } from "@/lib/tools-registry";

export const QUALITY_MIN = 60;
export const QUALITY_MAX = 100;

const formatItems = encodableFormats.map((format) => ({ value: format, label: formatInfo[format].label }));

interface ConverterOptionsProps {
  options: ConvertOptions;
  onChange: (options: ConvertOptions) => void;
  /** Show the output-format picker (universal converter). */
  chooseFormat: boolean;
}

export function ConverterOptions({ options, onChange, chooseFormat }: ConverterOptionsProps) {
  const info = formatInfo[options.format];
  const update = (patch: Partial<ConvertOptions>) => onChange({ ...options, ...patch });

  return (
    <div className="grid gap-5 rounded-xl border bg-card p-4 sm:grid-cols-3">
      {chooseFormat && (
        <div className="space-y-2">
          <Label htmlFor="output-format">Convert to</Label>
          <Select
            items={formatItems}
            value={options.format}
            onValueChange={(value) => value && update({ format: value as ImageFormat })}
          >
            <SelectTrigger id="output-format" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formatItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {info.lossy ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label id="quality-label">Quality</Label>
            <span className="text-sm tabular-nums text-muted-foreground">{options.quality}</span>
          </div>
          <Slider
            min={QUALITY_MIN}
            max={QUALITY_MAX}
            step={1}
            value={[options.quality]}
            thumbLabel="Quality"
            onValueChange={(value) => update({ quality: Array.isArray(value) ? value[0] : value })}
          />
          <p className="text-xs text-muted-foreground">Higher means better quality and a larger file.</p>
        </div>
      ) : (
        <div className="space-y-1 text-sm">
          <p className="font-medium">Lossless</p>
          <p className="text-muted-foreground">{info.label} keeps every pixel exactly, so there&apos;s no quality setting.</p>
        </div>
      )}

      {!info.transparency && (
        <div className="space-y-2">
          <Label htmlFor="background-color">Background for transparent areas</Label>
          <div className="flex items-center gap-2">
            <input
              id="background-color"
              type="color"
              value={options.background}
              onChange={(event) => update({ background: event.target.value })}
              className="h-8 w-12 cursor-pointer rounded-md border bg-transparent p-0.5"
            />
            <span className="font-mono text-sm uppercase text-muted-foreground">{options.background}</span>
          </div>
          <p className="text-xs text-muted-foreground">{info.label} can&apos;t store transparency.</p>
        </div>
      )}
    </div>
  );
}
