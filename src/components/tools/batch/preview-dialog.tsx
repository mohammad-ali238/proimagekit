"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { DoneItem } from "@/hooks/use-image-queue";
import { formatBytes, formatDimensions } from "@/lib/format";
import { CompareSlider } from "./compare-slider";

function PreviewPane({ label, src, detail }: { label: string; src: string; detail: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:20px_20px]">
        {failed ? (
          <p className="px-4 text-center text-sm text-muted-foreground">Your browser can&apos;t display this format.</p>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- local blob URL, next/image can't optimise it
          <img src={src} alt={label} className="max-h-full max-w-full object-contain" onError={() => setFailed(true)} />
        )}
      </div>
      <figcaption className="text-sm">
        <span className="font-medium">{label}</span> <span className="text-muted-foreground">· {detail}</span>
      </figcaption>
    </figure>
  );
}

interface PreviewDialogProps {
  item: DoneItem | null;
  onClose: () => void;
  /** Show a before/after slider instead of side-by-side images (for same-size results). */
  compare?: boolean;
}

export function PreviewDialog({ item, onClose, compare = false }: PreviewDialogProps) {
  const result = item?.result;
  const originalDetail = item && result ? `${formatBytes(item.file.size)} · ${formatDimensions(result.originalWidth, result.originalHeight)}` : "";
  const resultDetail = result ? `${formatBytes(result.blob.size)} · ${formatDimensions(result.width, result.height)}` : "";

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        {item && result && (
          <>
            <DialogHeader>
              <DialogTitle className="truncate pr-8">{item.file.name}</DialogTitle>
              <DialogDescription>
                {compare ? "Drag the slider to compare the original with the result." : "Before and after."}
              </DialogDescription>
            </DialogHeader>
            {compare ? (
              <div className="space-y-2">
                <CompareSlider before={item.previewUrl} after={result.url} />
                <p className="flex justify-between text-sm text-muted-foreground">
                  <span>Original · {originalDetail}</span>
                  <span>Result · {resultDetail}</span>
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <PreviewPane label="Original" src={item.previewUrl} detail={originalDetail} />
                <PreviewPane label="Result" src={result.url} detail={resultDetail} />
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
