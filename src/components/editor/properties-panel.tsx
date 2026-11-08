"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Bold, Copy, Italic, Lock, LockOpen, RotateCcw, Trash2 } from "lucide-react";
import { SliderField } from "@/components/tools/slider-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  centredCropRect,
  defaultFilters,
  fontFamilies,
  type EditorElement,
  type Filters,
  type TextElement,
} from "@/lib/editor/document";
import { formatDimensions } from "@/lib/format";
import { cn } from "@/lib/utils";
import { selectedElement, useEditor } from "./store";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border bg-card p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
  allowNone,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  allowNone?: boolean;
}) {
  const none = value === "transparent";
  return (
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        {allowNone && (
          <Switch size="sm" aria-label={`Use ${label.toLowerCase()} colour`} checked={!none} onCheckedChange={(on) => onChange(on ? "#ffffff" : "transparent")} />
        )}
        <input
          id={id}
          type="color"
          value={none ? "#ffffff" : value}
          disabled={none}
          onChange={(event) => onChange(event.target.value)}
          className="h-7 w-10 cursor-pointer rounded-md border bg-transparent p-0.5 disabled:opacity-40"
        />
      </div>
    </div>
  );
}

function ToggleButton({ label, pressed, onClick, children }: { label: string; pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(pressed && "border-primary bg-primary/10 text-primary")}
    >
      {children}
    </Button>
  );
}

function TextProperties({ element, update }: { element: TextElement; update: (patch: Partial<TextElement>) => void }) {
  const textEditRequest = useEditor((state) => state.textEditRequest);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const bold = element.fontStyle.includes("bold");
  const italic = element.fontStyle.includes("italic");
  const style = (nextBold: boolean, nextItalic: boolean) =>
    (nextBold && nextItalic ? "bold italic" : nextBold ? "bold" : nextItalic ? "italic" : "normal") as TextElement["fontStyle"];

  // Double-clicking text on the canvas focuses this box.
  useEffect(() => {
    if (textEditRequest > 0) {
      textarea.current?.focus();
      textarea.current?.select();
    }
  }, [textEditRequest]);

  return (
    <Section title="Text">
      <textarea
        ref={textarea}
        aria-label="Text content"
        value={element.text}
        rows={3}
        onChange={(event) => update({ text: event.target.value })}
        className="w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <div className="space-y-2">
        <Label htmlFor="font-family">Font</Label>
        <Select
          items={fontFamilies.map((font) => ({ value: font, label: font }))}
          value={element.fontFamily}
          onValueChange={(fontFamily) => fontFamily && update({ fontFamily })}
        >
          <SelectTrigger id="font-family" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontFamilies.map((font) => (
              <SelectItem key={font} value={font}>
                <span style={{ fontFamily: font }}>{font}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <SliderField label="Size" value={Math.round(element.fontSize)} min={8} max={400} unit="px" onChange={(fontSize) => update({ fontSize })} />
      <div className="flex flex-wrap items-center gap-1">
        <ToggleButton label="Bold" pressed={bold} onClick={() => update({ fontStyle: style(!bold, italic) })}>
          <Bold />
        </ToggleButton>
        <ToggleButton label="Italic" pressed={italic} onClick={() => update({ fontStyle: style(bold, !italic) })}>
          <Italic />
        </ToggleButton>
        <span className="mx-1" />
        <ToggleButton label="Align left" pressed={element.align === "left"} onClick={() => update({ align: "left" })}>
          <AlignLeft />
        </ToggleButton>
        <ToggleButton label="Align centre" pressed={element.align === "center"} onClick={() => update({ align: "center" })}>
          <AlignCenter />
        </ToggleButton>
        <ToggleButton label="Align right" pressed={element.align === "right"} onClick={() => update({ align: "right" })}>
          <AlignRight />
        </ToggleButton>
      </div>
      <ColorField id="text-fill" label="Colour" value={element.fill} onChange={(fill) => update({ fill })} />
      <ColorField id="text-stroke" label="Outline" value={element.stroke} onChange={(stroke) => update({ stroke })} />
      <SliderField label="Outline width" value={element.strokeWidth} min={0} max={20} unit="px" onChange={(strokeWidth) => update({ strokeWidth })} />
    </Section>
  );
}

function FilterProperties({ filters, onChange }: { filters: Filters; onChange: (filters: Filters) => void }) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  return (
    <Section title="Adjustments">
      <SliderField label="Brightness" value={Math.round(filters.brightness * 100)} min={-100} max={100} unit="" onChange={(value) => set({ brightness: value / 100 })} />
      <SliderField label="Contrast" value={filters.contrast} min={-100} max={100} unit="" onChange={(contrast) => set({ contrast })} />
      <SliderField label="Saturation" value={Math.round(filters.saturation * 50)} min={-100} max={100} unit="" onChange={(value) => set({ saturation: value / 50 })} />
      <SliderField label="Blur" value={filters.blur} min={0} max={40} unit="px" onChange={(blur) => set({ blur })} />
      <div className="flex items-center justify-between">
        <Label htmlFor="grayscale">Black & white</Label>
        <Switch id="grayscale" checked={filters.grayscale} onCheckedChange={(grayscale) => set({ grayscale })} />
      </div>
      <Button variant="outline" size="sm" onClick={() => onChange({ ...defaultFilters })}>
        <RotateCcw /> Reset adjustments
      </Button>
    </Section>
  );
}

function ShapeProperties({ element, update }: { element: EditorElement; update: (patch: Partial<EditorElement>) => void }) {
  if (element.type === "rect" || element.type === "ellipse") {
    return (
      <Section title={element.type === "rect" ? "Rectangle" : "Ellipse"}>
        <ColorField id="shape-fill" label="Fill" value={element.fill} allowNone onChange={(fill) => update({ fill })} />
        <ColorField id="shape-stroke" label="Border" value={element.stroke} onChange={(stroke) => update({ stroke })} />
        <SliderField label="Border width" value={element.strokeWidth} min={0} max={60} unit="px" onChange={(strokeWidth) => update({ strokeWidth })} />
        {element.type === "rect" && (
          <SliderField label="Rounded corners" value={element.cornerRadius} min={0} max={200} unit="px" onChange={(cornerRadius) => update({ cornerRadius })} />
        )}
      </Section>
    );
  }
  if (element.type === "arrow") {
    return (
      <Section title={element.pointer ? "Arrow" : "Line"}>
        <ColorField id="arrow-stroke" label="Colour" value={element.stroke} onChange={(stroke) => update({ stroke })} />
        <SliderField label="Thickness" value={element.strokeWidth} min={1} max={60} unit="px" onChange={(strokeWidth) => update({ strokeWidth })} />
        <div className="flex items-center justify-between">
          <Label htmlFor="arrow-head">Arrow head</Label>
          <Switch id="arrow-head" checked={element.pointer} onCheckedChange={(pointer) => update({ pointer })} />
        </div>
      </Section>
    );
  }
  return null;
}

function CropPanel() {
  const doc = useEditor((state) => state.doc);
  const crop = useEditor((state) => state.crop);
  const setCrop = useEditor((state) => state.setCrop);
  const applyCrop = useEditor((state) => state.applyCrop);
  const cancelCrop = useEditor((state) => state.cancelCrop);
  if (!doc || !crop) return null;

  const ratios: { label: string; value: number | null }[] = [
    { label: "Free", value: null },
    { label: "1:1", value: 1 },
    { label: "4:3", value: 4 / 3 },
    { label: "16:9", value: 16 / 9 },
    { label: "9:16", value: 9 / 16 },
  ];

  return (
    <Section title="Crop canvas">
      <div className="flex flex-wrap gap-1.5">
        {ratios.map((ratio) => (
          <Button
            key={ratio.label}
            variant="outline"
            size="sm"
            aria-pressed={crop.aspect === ratio.value}
            className={cn(crop.aspect === ratio.value && "border-primary bg-primary/10 text-primary")}
            onClick={() => setCrop(centredCropRect(doc, ratio.value), ratio.value)}
          >
            {ratio.label}
          </Button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground" data-testid="editor-crop-size">
        {formatDimensions(crop.rect.width, crop.rect.height)} px
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={applyCrop}>
          Apply crop
        </Button>
        <Button size="sm" variant="ghost" onClick={cancelCrop}>
          Cancel
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Drag the frame or its corners. Enter applies, Esc cancels.</p>
    </Section>
  );
}

function DocumentPanel() {
  const doc = useEditor((state) => state.doc);
  const setBackground = useEditor((state) => state.setBackground);
  if (!doc) return null;
  return (
    <Section title="Canvas">
      <p className="text-sm text-muted-foreground" data-testid="editor-size">
        {formatDimensions(doc.width, doc.height)} px
      </p>
      <ColorField id="canvas-background" label="Background" value={doc.background ?? "transparent"} allowNone onChange={(value) => setBackground(value === "transparent" ? null : value)} />
      <p className="text-xs text-muted-foreground">Select an element on the canvas or in the layers list to edit it.</p>
    </Section>
  );
}

export function PropertiesPanel() {
  const element = useEditor(selectedElement);
  const tool = useEditor((state) => state.tool);
  const update = useEditor((state) => state.update);
  const remove = useEditor((state) => state.remove);
  const duplicate = useEditor((state) => state.duplicate);
  const move = useEditor((state) => state.move);

  if (tool === "crop") return <CropPanel />;
  if (!element) return <DocumentPanel />;

  const patch = (next: Partial<EditorElement>) => update(element.id, next);

  return (
    <div className="space-y-3">
      {element.type === "text" && <TextProperties element={element} update={patch} />}
      <ShapeProperties element={element} update={patch} />
      {element.type === "image" && <FilterProperties filters={element.filters} onChange={(filters) => patch({ filters })} />}

      <Section title="Arrange">
        <SliderField label="Opacity" value={Math.round(element.opacity * 100)} min={0} max={100} unit="%" onChange={(value) => patch({ opacity: value / 100 })} />
        <SliderField label="Rotation" value={Math.round(element.rotation)} min={-180} max={180} unit="°" onChange={(rotation) => patch({ rotation })} />
        <div className="flex flex-wrap gap-1.5">
          <Button variant="outline" size="sm" onClick={() => move(element.id, "up")}>
            <ArrowUp /> Forward
          </Button>
          <Button variant="outline" size="sm" onClick={() => move(element.id, "down")}>
            <ArrowDown /> Backward
          </Button>
          <Button variant="outline" size="sm" onClick={() => patch({ locked: !element.locked })}>
            {element.locked ? <LockOpen /> : <Lock />} {element.locked ? "Unlock" : "Lock"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => duplicate(element.id)}>
            <Copy /> Duplicate
          </Button>
          <Button variant="destructive" size="sm" onClick={() => remove(element.id)}>
            <Trash2 /> Delete
          </Button>
        </div>
      </Section>
    </div>
  );
}
