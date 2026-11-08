"use client";

import { useState } from "react";
import { AlertCircle, Download, Eye, FileImage, Loader2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QueueItem } from "@/hooks/use-image-queue";
import { downloadBlob } from "@/lib/download";
import { formatBytes, formatDimensions, percentChange } from "@/lib/format";
import { cn } from "@/lib/utils";

function Thumbnail({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <FileImage className="size-6 text-muted-foreground" aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element -- local blob URL
  return <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} />;
}

interface FileRowProps {
  item: QueueItem;
  /** e.g. "Converting…" */
  processingLabel: string;
  onPreview: () => void;
  onRemove: () => void;
  onRetry: () => void;
}

export function FileRow({ item, processingLabel, onPreview, onRemove, onRetry }: FileRowProps) {
  const { file, result, status } = item;
  const change = result ? percentChange(file.size, result.blob.size) : 0;

  return (
    <li className="flex items-center gap-3 p-3">
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        <Thumbnail key={result?.url ?? item.previewUrl} src={result?.url ?? item.previewUrl} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={result?.name ?? file.name}>
          {result?.name ?? file.name}
        </p>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {status === "queued" && `${formatBytes(file.size)} · Waiting…`}
          {status === "processing" && (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" aria-hidden /> {processingLabel}
            </span>
          )}
          {status === "error" && (
            <span className="inline-flex items-center gap-1 text-destructive">
              <AlertCircle className="size-3" aria-hidden /> {item.error}
            </span>
          )}
          {status === "done" && result && (
            <>
              {formatBytes(file.size)} → {formatBytes(result.blob.size)}{" "}
              <span
                className={cn(
                  "font-medium",
                  change <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
                )}
              >
                ({change > 0 ? "+" : ""}
                {change}%)
              </span>{" "}
              · {formatDimensions(result.width, result.height)}
              {result.note && ` · ${result.note}`}
            </>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {status === "done" && result && (
          <>
            <Button variant="ghost" size="icon" onClick={onPreview} aria-label={`Preview ${result.name}`}>
              <Eye />
            </Button>
            <Button size="sm" onClick={() => downloadBlob(result.blob, result.name)} aria-label={`Download ${result.name}`}>
              <Download /> <span className="hidden sm:inline">Download</span>
            </Button>
          </>
        )}
        {status === "error" && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw /> Retry
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onRemove} aria-label={`Remove ${file.name}`}>
          <X />
        </Button>
      </div>
    </li>
  );
}
