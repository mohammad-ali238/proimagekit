"use client";

import dynamic from "next/dynamic";
import type { ReactElement } from "react";
import { Loader2 } from "lucide-react";

/** Reserves roughly a tool's height so the page doesn't jump when the tool loads. */
function ToolLoading() {
  return (
    <div className="flex min-h-96 items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden /> Loading tool…
    </div>
  );
}

const ConverterTool = dynamic(() => import("@/components/tools/converter/converter-tool"), {
  ssr: false,
  loading: ToolLoading,
});

const CompressorTool = dynamic(() => import("@/components/tools/compressor/compressor-tool"), {
  ssr: false,
  loading: ToolLoading,
});

const ResizerTool = dynamic(() => import("@/components/tools/resizer/resizer-tool"), {
  ssr: false,
  loading: ToolLoading,
});

const CropperTool = dynamic(() => import("@/components/tools/cropper/cropper-tool"), {
  ssr: false,
  loading: ToolLoading,
});

const RotatorTool = dynamic(() => import("@/components/tools/rotator/rotator-tool"), {
  ssr: false,
  loading: ToolLoading,
});

const WatermarkTool = dynamic(() => import("@/components/tools/watermark/watermark-tool"), {
  ssr: false,
  loading: ToolLoading,
});

const ColorPickerTool = dynamic(() => import("@/components/tools/color-picker/color-picker-tool"), {
  ssr: false,
  loading: ToolLoading,
});

const MetadataViewerTool = dynamic(() => import("@/components/tools/metadata-viewer/metadata-viewer-tool"), {
  ssr: false,
  loading: ToolLoading,
});

const ExifRemoverTool = dynamic(() => import("@/components/tools/exif-remover/exif-remover-tool"), {
  ssr: false,
  loading: ToolLoading,
});

const ImageEditor = dynamic(() => import("@/components/editor/image-editor"), {
  ssr: false,
  loading: ToolLoading,
});

/**
 * Maps a tool slug to its client-only UI. Each entry is loaded with
 * `next/dynamic` and `{ ssr: false }` so tools are code-split and never
 * rendered on the server (they depend on canvas, File and Worker APIs).
 * Add an entry here when a tool is built and set its status to "ready".
 */
const toolComponents: Partial<Record<string, (slug: string) => ReactElement>> = {
  "heic-to-jpg": (slug) => <ConverterTool slug={slug} />,
  "webp-to-png": (slug) => <ConverterTool slug={slug} />,
  "webp-to-jpg": (slug) => <ConverterTool slug={slug} />,
  "png-to-jpg": (slug) => <ConverterTool slug={slug} />,
  "jpg-to-png": (slug) => <ConverterTool slug={slug} />,
  "image-format-converter": (slug) => <ConverterTool slug={slug} />,
  "image-compressor": () => <CompressorTool />,
  "image-resizer": () => <ResizerTool />,
  "image-cropper": () => <CropperTool />,
  "image-rotator": () => <RotatorTool />,
  "watermark-adder": () => <WatermarkTool />,
  "image-color-picker": () => <ColorPickerTool />,
  "image-metadata-viewer": () => <MetadataViewerTool />,
  "exif-remover": () => <ExifRemoverTool />,
  "image-editor": () => <ImageEditor />,
};

export function ToolArea({ slug }: { slug: string }) {
  return toolComponents[slug]?.(slug) ?? null;
}
