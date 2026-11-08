"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { encodableFormats, formatInfo } from "@/lib/image/formats";
import type { ImageFormat } from "@/lib/tools-registry";

export type OutputFormatChoice = ImageFormat | "original";

const items: { value: OutputFormatChoice; label: string }[] = [
  { value: "original", label: "Same as original" },
  ...encodableFormats.map((format) => ({ value: format, label: formatInfo[format].label })),
];

export function OutputFormatSelect({ value, onChange }: { value: OutputFormatChoice; onChange: (value: OutputFormatChoice) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="output-format">Output format</Label>
      <Select items={items} value={value} onValueChange={(next) => next && onChange(next as OutputFormatChoice)}>
        <SelectTrigger id="output-format" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
