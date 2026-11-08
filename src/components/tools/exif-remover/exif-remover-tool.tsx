"use client";

import { ShieldCheck } from "lucide-react";
import { BatchWorkspace } from "@/components/tools/batch/batch-workspace";
import { useImageQueue } from "@/hooks/use-image-queue";
import { acceptFor, formatList } from "@/lib/image/formats";
import { removeMetadata, removeMetadataOptions } from "@/lib/image/remove-metadata";

const accept = acceptFor("any");

export default function ExifRemoverTool() {
  const queue = useImageQueue(removeMetadataOptions, removeMetadata);

  return (
    <div className="space-y-4">
      <p className="flex gap-2 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <span>
          Removes GPS location, camera details, dates and author information. JPG, PNG and WebP files are cleaned without
          touching the image itself; colour profiles are kept so colours stay accurate. Other formats are saved as a clean copy.
        </span>
      </p>
      <BatchWorkspace
        queue={queue}
        accept={accept}
        formatsLabel={formatList("any")}
        verb={{ active: "Cleaning", past: "cleaned" }}
        zipName="clean-images.zip"
      />
    </div>
  );
}
