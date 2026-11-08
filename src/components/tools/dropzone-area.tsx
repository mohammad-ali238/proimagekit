"use client";

import { ImagePlus } from "lucide-react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DropzoneAreaProps {
  accept: Record<string, string[]>;
  onFiles: (files: File[]) => void;
  /** e.g. "HEIC or HEIF" — shown to the user. */
  formatsLabel: string;
  multiple?: boolean;
  compact?: boolean;
}

export function DropzoneArea({ accept, onFiles, formatsLabel, multiple = true, compact = false }: DropzoneAreaProps) {
  const onDropRejected = (rejections: FileRejection[]) => {
    const names = rejections.map((rejection) => rejection.file.name);
    toast.error(
      names.length === 1
        ? `${names[0]} isn't a supported file. Please choose ${formatsLabel}.`
        : `${names.length} files were skipped. Please choose ${formatsLabel}.`,
    );
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    multiple,
    onDropAccepted: onFiles,
    onDropRejected,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition-colors outline-none hover:border-primary/60 hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50",
        compact ? "px-4 py-5" : "px-6 py-14",
        isDragActive && "border-primary bg-primary/5",
      )}
    >
      <input {...getInputProps()} aria-label={`Choose ${formatsLabel} files`} />
      <ImagePlus className={cn("text-primary", compact ? "size-6" : "size-10")} aria-hidden />
      <p className="font-medium">
        {isDragActive ? "Drop your images here" : compact ? "Add more images" : "Drop images here or click to choose"}
      </p>
      {!compact && <p className="text-sm text-muted-foreground">{formatsLabel} · processed on your device</p>}
    </div>
  );
}
