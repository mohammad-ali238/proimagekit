"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { FilePlus2, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { SingleImagePicker } from "@/components/tools/single-image-picker";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download";
import { createImageElement } from "@/lib/editor/document";
import { formatInfo } from "@/lib/image/formats";
import { importImage, releaseAssets } from "./assets";
import { CanvasStage } from "./canvas-stage";
import { exportDocument, type ExportFormat } from "./export";
import { LayersPanel } from "./layers-panel";
import { PropertiesPanel } from "./properties-panel";
import { closeDocument, openDocument, useEditor } from "./store";
import { Toolbar } from "./toolbar";
import { useEditorShortcuts } from "./use-shortcuts";

const shortcuts = [
  ["Ctrl/⌘ Z", "Undo"],
  ["Ctrl/⌘ Shift Z", "Redo"],
  ["Delete", "Remove selected"],
  ["Ctrl/⌘ D", "Duplicate"],
  ["Arrows", "Nudge (Shift = 10px)"],
  ["T R O A", "Text, rectangle, ellipse, arrow"],
  ["C", "Crop"],
  ["+ − 0", "Zoom, fit"],
];

export default function ImageEditor() {
  const doc = useEditor((state) => state.doc);
  const fileName = useEditor((state) => state.fileName);
  const setZoom = useEditor((state) => state.setZoom);
  const add = useEditor((state) => state.add);
  const layerRef = useRef<Konva.Layer>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fit = useCallback(() => {
    const current = useEditor.getState().doc;
    const viewport = viewportRef.current;
    if (!current || !viewport) return;
    const availableWidth = viewport.clientWidth - 32;
    const availableHeight = Math.max(320, window.innerHeight * 0.72);
    setZoom(Math.min(1, availableWidth / current.width, availableHeight / current.height));
  }, [setZoom]);

  useEditorShortcuts({ onFit: fit });

  // Fit whenever a document opens or its size changes (e.g. after cropping).
  useEffect(() => {
    if (doc) fit();
  }, [doc?.width, doc?.height, fit]); // eslint-disable-line react-hooks/exhaustive-deps -- only size changes matter

  // Leaving the page would lose the edit; ask first.
  useEffect(() => {
    if (!doc) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [doc]);

  useEffect(
    () => () => {
      closeDocument();
      releaseAssets();
    },
    [],
  );

  const openFile = async (file: File) => {
    setOpening(true);
    setOpenError(null);
    try {
      const image = await importImage(file);
      openDocument(
        {
          width: image.width,
          height: image.height,
          background: null,
          elements: [{ ...createImageElement(image.src, image.width, image.height, "Photo"), locked: true }],
        },
        file.name,
      );
      if (image.downscaled) toast.info("This image was scaled down to fit your browser's canvas limit.");
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : "Couldn't open this image.");
    } finally {
      setOpening(false);
    }
  };

  const startBlank = () => openDocument({ width: 1200, height: 800, background: "#ffffff", elements: [] }, "untitled.png");

  const addImage = async (file: File) => {
    const current = useEditor.getState().doc;
    if (!current) return;
    try {
      const image = await importImage(file);
      const scale = Math.min(1, (current.width * 0.5) / image.width, (current.height * 0.5) / image.height);
      const element = createImageElement(
        image.src,
        image.width,
        image.height,
        file.name.replace(/\.[^.]+$/, "") || "Image",
        (current.width - image.width * scale) / 2,
        (current.height - image.height * scale) / 2,
      );
      add({ ...element, scaleX: scale, scaleY: scale });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't add this image.");
    }
  };

  const exportImage = async (format: ExportFormat) => {
    const { doc: current, zoom, select } = useEditor.getState();
    if (!current || !layerRef.current) return;
    setExporting(true);
    select(null);
    try {
      const blob = await exportDocument(layerRef.current, current, zoom, format);
      const base = fileName.replace(/\.[^.]+$/, "") || "image";
      downloadBlob(blob, `${base}-edited.${formatInfo[format].extension}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't export the image.");
    } finally {
      setExporting(false);
    }
  };

  const close = () => {
    if (useEditor.temporal.getState().pastStates.length > 0 && !window.confirm("Close this image? Unsaved changes will be lost.")) return;
    closeDocument();
    releaseAssets();
  };

  if (!doc) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <SingleImagePicker onFile={(file) => void openFile(file)} loading={opening} error={openError} />
        <div className="flex justify-center">
          <Button variant="outline" onClick={startBlank}>
            <FilePlus2 /> Start with a blank canvas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Toolbar onAddImage={(file) => void addImage(file)} onExport={(format) => void exportImage(format)} onFit={fit} onClose={close} exporting={exporting} />
      <div className="grid gap-3 lg:grid-cols-[1fr_19rem]">
        <div
          ref={viewportRef}
          className="flex max-h-[78vh] min-h-80 overflow-auto rounded-xl border bg-muted/40 p-4"
          data-testid="editor-viewport"
        >
          <div className="m-auto shadow-lg ring-1 ring-foreground/10 bg-[repeating-conic-gradient(var(--muted)_0_25%,var(--background)_0_50%)] bg-[length:20px_20px]">
            <CanvasStage contentLayerRef={layerRef} />
          </div>
        </div>
        <aside className="space-y-3" aria-label="Editor panels">
          <PropertiesPanel />
          <LayersPanel />
          <details className="rounded-xl border bg-card p-4 text-sm">
            <summary className="flex cursor-pointer items-center gap-2 font-semibold">
              <Keyboard className="size-4" aria-hidden /> Keyboard shortcuts
            </summary>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
              {shortcuts.map(([keys, action]) => (
                <div key={keys} className="contents">
                  <dt>
                    <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">{keys}</kbd>
                  </dt>
                  <dd className="text-muted-foreground">{action}</dd>
                </div>
              ))}
            </dl>
          </details>
        </aside>
      </div>
    </div>
  );
}
