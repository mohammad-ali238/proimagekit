"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { DropzoneArea } from "@/components/tools/dropzone-area";
import { acceptFor, formatList } from "@/lib/image/formats";

const accept = acceptFor("any");

/** Dropzone plus loading and error states for single-image tools. */
export function SingleImagePicker({ onFile, loading, error }: { onFile: (file: File) => void; loading: boolean; error: string | null }) {
  return (
    <div className="space-y-3">
      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-14 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Opening image…
        </div>
      ) : (
        <DropzoneArea accept={accept} onFiles={(files) => files[0] && onFile(files[0])} formatsLabel={formatList("any")} multiple={false} />
      )}
      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="size-4" aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}
