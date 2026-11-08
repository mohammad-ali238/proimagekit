"use client";

import { useRef, type ReactNode } from "react";
import {
  ArrowUpRight,
  Circle,
  Crop,
  Download,
  ImagePlus,
  Maximize,
  MousePointer2,
  Redo2,
  Square,
  Stamp,
  Type,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useStore } from "zustand";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { createElement, createWatermark } from "@/lib/editor/document";
import { formatInfo } from "@/lib/image/formats";
import { cn } from "@/lib/utils";
import { exportFormats, type ExportFormat } from "./export";
import { redo, undo, useEditor } from "./store";

function ToolButton({
  label,
  shortcut,
  active,
  onClick,
  disabled,
  children,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  const title = shortcut ? `${label} (${shortcut})` : label;
  return (
    <Button
      variant="ghost"
      size="icon"
      title={title}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(active && "bg-primary/10 text-primary hover:bg-primary/15")}
    >
      {children}
    </Button>
  );
}

interface ToolbarProps {
  onAddImage: (file: File) => void;
  onExport: (format: ExportFormat) => void;
  onFit: () => void;
  onClose: () => void;
  exporting: boolean;
}

export function Toolbar({ onAddImage, onExport, onFit, onClose, exporting }: ToolbarProps) {
  const doc = useEditor((state) => state.doc);
  const tool = useEditor((state) => state.tool);
  const zoom = useEditor((state) => state.zoom);
  const add = useEditor((state) => state.add);
  const startCrop = useEditor((state) => state.startCrop);
  const cancelCrop = useEditor((state) => state.cancelCrop);
  const setZoom = useEditor((state) => state.setZoom);
  const canUndo = useStore(useEditor.temporal, (state) => state.pastStates.length > 0);
  const canRedo = useStore(useEditor.temporal, (state) => state.futureStates.length > 0);
  const fileInput = useRef<HTMLInputElement>(null);

  if (!doc) return null;

  return (
    <div role="toolbar" aria-label="Editor tools" className="flex flex-wrap items-center gap-1 rounded-xl border bg-card p-1.5">
      <ToolButton label="Select" shortcut="V" active={tool === "select"} onClick={cancelCrop}>
        <MousePointer2 />
      </ToolButton>
      <ToolButton label="Add text" shortcut="T" onClick={() => add(createElement("text", doc))}>
        <Type />
      </ToolButton>
      <ToolButton label="Add rectangle" shortcut="R" onClick={() => add(createElement("rect", doc))}>
        <Square />
      </ToolButton>
      <ToolButton label="Add ellipse" shortcut="O" onClick={() => add(createElement("ellipse", doc))}>
        <Circle />
      </ToolButton>
      <ToolButton label="Add arrow" shortcut="A" onClick={() => add(createElement("arrow", doc))}>
        <ArrowUpRight />
      </ToolButton>
      <ToolButton label="Add watermark" onClick={() => add(createWatermark(doc))}>
        <Stamp />
      </ToolButton>
      <ToolButton label="Add image" onClick={() => fileInput.current?.click()}>
        <ImagePlus />
      </ToolButton>
      <input
        ref={fileInput}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onAddImage(file);
          event.target.value = "";
        }}
      />
      <ToolButton label="Crop canvas" shortcut="C" active={tool === "crop"} onClick={() => (tool === "crop" ? cancelCrop() : startCrop())}>
        <Crop />
      </ToolButton>

      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolButton label="Undo" shortcut="Ctrl+Z" onClick={undo} disabled={!canUndo}>
        <Undo2 />
      </ToolButton>
      <ToolButton label="Redo" shortcut="Ctrl+Shift+Z" onClick={redo} disabled={!canRedo}>
        <Redo2 />
      </ToolButton>

      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolButton label="Zoom out" shortcut="-" onClick={() => setZoom(zoom / 1.25)}>
        <ZoomOut />
      </ToolButton>
      <Button variant="ghost" size="sm" className="w-14 tabular-nums" title="Actual size (100%)" onClick={() => setZoom(1)}>
        {Math.round(zoom * 100)}%
      </Button>
      <ToolButton label="Zoom in" shortcut="+" onClick={() => setZoom(zoom * 1.25)}>
        <ZoomIn />
      </ToolButton>
      <ToolButton label="Fit to screen" shortcut="0" onClick={onFit}>
        <Maximize />
      </ToolButton>

      <div className="ml-auto flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size="sm" disabled={exporting} />}>
            <Download /> Download
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {exportFormats.map((format) => (
              <DropdownMenuItem key={format} onClick={() => onExport(format)}>
                {formatInfo[format].label}
                <span className="ml-auto text-xs text-muted-foreground">
                  {format === "png" ? "lossless" : format === "avif" ? "smallest" : format === "webp" ? "small" : "universal"}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <ToolButton label="Close image" onClick={onClose}>
          <X />
        </ToolButton>
      </div>
    </div>
  );
}
