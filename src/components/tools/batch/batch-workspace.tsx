"use client";

import { useState } from "react";
import { FileArchive, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DropzoneArea } from "@/components/tools/dropzone-area";
import { Button } from "@/components/ui/button";
import type { DoneItem, ImageQueue } from "@/hooks/use-image-queue";
import { useProGate } from "@/hooks/use-pro-gate";
import { createZip, downloadBlob } from "@/lib/download";
import { formatBytes, percentChange } from "@/lib/format";
import { FileRow } from "./file-row";
import { PreviewDialog } from "./preview-dialog";

interface BatchWorkspaceProps {
  queue: ImageQueue;
  accept: Record<string, string[]>;
  formatsLabel: string;
  /** Verb for the work in progress and when finished, e.g. { active: "Converting", past: "converted" }. */
  verb: { active: string; past: string };
  zipName: string;
  /** Use the before/after slider in the preview (results keep the original's framing). */
  compare?: boolean;
  /** Show the first result large above the list, so setting changes are visible straight away. */
  livePreview?: boolean;
}

/** Dropzone, file list, totals, ZIP download and preview shared by every batch image tool. */
export function BatchWorkspace({ queue, accept, formatsLabel, verb, zipName, compare, livePreview }: BatchWorkspaceProps) {
  const { items, addFiles, removeItem, clear, retry, pending } = queue;
  const { limits, requirePro } = useProGate();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);

  const done = items.filter((item): item is DoneItem => !!item.result);
  const finished = items.filter((item) => item.status === "done" || item.status === "error").length;
  const totalBefore = done.reduce((sum, item) => sum + item.file.size, 0);
  const totalAfter = done.reduce((sum, item) => sum + item.result.blob.size, 0);

  const handleFiles = (files: File[]) => {
    const room = limits.maxBatchFiles - items.length;
    if (files.length > room) {
      requirePro(
        `The free version handles up to ${limits.maxBatchFiles} images at a time. ` +
          (room > 0 ? `The first ${room} were added.` : "Remove some images to add more."),
      );
    }
    if (room > 0) addFiles(files.slice(0, room));
  };

  const downloadAll = async () => {
    setZipping(true);
    try {
      const zip = await createZip(done.map((item) => ({ name: item.result.name, blob: item.result.blob })));
      downloadBlob(zip, zipName);
    } catch {
      toast.error("Couldn't create the ZIP file.");
    } finally {
      setZipping(false);
    }
  };

  return (
    <>
      <DropzoneArea accept={accept} onFiles={handleFiles} formatsLabel={formatsLabel} compact={items.length > 0} />

      {livePreview && items.length > 0 && (
        <figure className="overflow-hidden rounded-xl border">
          <div className="flex min-h-48 items-center justify-center bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:20px_20px] p-2">
            {done[0] ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob URL
              <img src={done[0].result.url} alt={`Preview of ${done[0].result.name}`} className="max-h-[60vh] max-w-full object-contain" />
            ) : (
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Updating preview" />
            )}
          </div>
          <figcaption className="border-t px-3 py-2 text-xs text-muted-foreground">
            Live preview of {done[0]?.result.name ?? items[0].file.name}
            {pending && done[0] && " · updating…"}
          </figcaption>
        </figure>
      )}

      {items.length > 0 && (
        <div className="rounded-xl border">
          <div className="flex flex-wrap items-center gap-2 border-b p-3">
            <p className="mr-auto text-sm text-muted-foreground" aria-live="polite">
              {pending ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="size-4 animate-spin" aria-hidden /> {verb.active} {Math.min(finished + 1, items.length)} of{" "}
                  {items.length}…
                </span>
              ) : (
                <>
                  {done.length} of {items.length} {verb.past}
                  {done.length > 0 &&
                    ` · ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)} (${percentChange(totalBefore, totalAfter)}%)`}
                </>
              )}
            </p>
            {done.length > 1 && (
              <Button size="sm" onClick={downloadAll} disabled={zipping}>
                {zipping ? <Loader2 className="animate-spin" /> : <FileArchive />} Download all (ZIP)
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={clear}>
              <Trash2 /> Clear
            </Button>
          </div>
          <ul className="divide-y">
            {items.map((item) => (
              <FileRow
                key={item.id}
                item={item}
                processingLabel={`${verb.active}…`}
                onPreview={() => setPreviewId(item.id)}
                onRemove={() => removeItem(item.id)}
                onRetry={() => retry(item.id)}
              />
            ))}
          </ul>
        </div>
      )}

      <PreviewDialog
        item={done.find((item) => item.id === previewId) ?? null}
        onClose={() => setPreviewId(null)}
        compare={compare}
      />
    </>
  );
}
