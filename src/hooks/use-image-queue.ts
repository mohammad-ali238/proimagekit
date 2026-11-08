"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProcessedImage } from "@/lib/image/types";

export type QueueStatus = "queued" | "processing" | "done" | "error";

export interface QueueItem {
  id: string;
  file: File;
  /** Object URL of the original file, for previews. */
  previewUrl: string;
  status: QueueStatus;
  error?: string;
  result?: ProcessedImage & { url: string };
}

export type DoneItem = QueueItem & { result: NonNullable<QueueItem["result"]> };

export type ProcessImage<Options> = (file: File, options: Options) => Promise<ProcessedImage>;

const SETTINGS_DEBOUNCE_MS = 350;

function revokeResult(item: QueueItem): void {
  if (item.result) URL.revokeObjectURL(item.result.url);
}

/**
 * Processes files one at a time as soon as they're added. When the options
 * change, finished files are processed again with the new settings; results
 * from a run that started with old settings are discarded.
 * `options` must be replaced (not mutated) when a setting changes.
 */
export function useImageQueue<Options>(options: Options, process: ProcessImage<Options>) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [appliedOptions, setAppliedOptions] = useState(options);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const itemsRef = useRef(items);
  const processRef = useRef(process);

  useEffect(() => {
    itemsRef.current = items;
    processRef.current = process;
  });

  // Wait until the user stops dragging a slider or typing before re-processing.
  useEffect(() => {
    const timer = setTimeout(() => setAppliedOptions(options), SETTINGS_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [options]);

  const isFirstOptions = useRef(true);
  useEffect(() => {
    if (isFirstOptions.current) {
      isFirstOptions.current = false;
      return;
    }
    generation.current++;
    // Re-queue everything with the new settings.
    setItems((current) =>
      current.map((item) => {
        revokeResult(item);
        return { ...item, status: "queued", error: undefined, result: undefined };
      }),
    );
  }, [appliedOptions]);

  // Don't start work while a settings change is still being debounced.
  const settled = options === appliedOptions;

  useEffect(() => {
    if (busy || !settled) return;
    const next = items.find((item) => item.status === "queued");
    if (!next) return;

    const runGeneration = generation.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the queue is driven by state changes
    setBusy(true);
    setItems((current) => current.map((item) => (item.id === next.id ? { ...item, status: "processing" } : item)));

    processRef
      .current(next.file, appliedOptions)
      .then((result) => {
        if (runGeneration !== generation.current) return;
        const url = URL.createObjectURL(result.blob);
        setItems((current) => {
          if (!current.some((item) => item.id === next.id)) {
            URL.revokeObjectURL(url);
            return current;
          }
          return current.map((item) => (item.id === next.id ? { ...item, status: "done", result: { ...result, url } } : item));
        });
      })
      .catch((error: unknown) => {
        if (runGeneration !== generation.current) return;
        const message = error instanceof Error ? error.message : "Something went wrong.";
        setItems((current) => current.map((item) => (item.id === next.id ? { ...item, status: "error", error: message } : item)));
      })
      .finally(() => setBusy(false));
  }, [items, busy, settled, appliedOptions]);

  // Release every object URL when the tool unmounts.
  useEffect(
    () => () => {
      for (const item of itemsRef.current) {
        URL.revokeObjectURL(item.previewUrl);
        revokeResult(item);
      }
    },
    [],
  );

  const addFiles = useCallback((files: File[]) => {
    const added = files.map<QueueItem>((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "queued",
    }));
    setItems((current) => [...current, ...added]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => {
      const item = current.find((entry) => entry.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
        revokeResult(item);
      }
      return current.filter((entry) => entry.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    generation.current++;
    setItems((current) => {
      for (const item of current) {
        URL.revokeObjectURL(item.previewUrl);
        revokeResult(item);
      }
      return [];
    });
  }, []);

  const retry = useCallback((id: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, status: "queued", error: undefined } : item)));
  }, []);

  return {
    items,
    addFiles,
    removeItem,
    clear,
    retry,
    pending: items.some((item) => item.status === "queued" || item.status === "processing"),
  };
}

export type ImageQueue = ReturnType<typeof useImageQueue>;
