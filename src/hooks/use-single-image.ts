"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { decodeImage } from "@/lib/image/decode";
import { displayUrl } from "@/lib/image/display";
import type { ImageFormat } from "@/lib/tools-registry";

export interface LoadedImage {
  file: File;
  format: ImageFormat | null;
  /** Decoded pixels with EXIF orientation applied. */
  bitmap: ImageBitmap;
  width: number;
  height: number;
  /** A URL any browser can display, matching the bitmap's orientation and size. */
  url: string;
}

function release(image: LoadedImage | null) {
  if (!image) return;
  image.bitmap.close();
  URL.revokeObjectURL(image.url);
}

/** Loads one image for tools that work on a single picture (cropper, colour picker…). */
export function useSingleImage() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<LoadedImage | null>(null);
  const loadId = useRef(0);

  useEffect(() => {
    imageRef.current = image;
  }, [image]);

  useEffect(() => () => release(imageRef.current), []);

  const load = useCallback(async (file: File) => {
    const id = ++loadId.current;
    setLoading(true);
    setError(null);
    try {
      const { bitmap, format } = await decodeImage(file);
      const url = await displayUrl(file, format, bitmap);
      const loaded = { file, format, bitmap, width: bitmap.width, height: bitmap.height, url };
      if (id !== loadId.current) return release(loaded);
      setImage((previous) => {
        release(previous);
        return loaded;
      });
    } catch (cause) {
      if (id === loadId.current) setError(cause instanceof Error ? cause.message : "Couldn't open this image.");
    } finally {
      if (id === loadId.current) setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    loadId.current++;
    setImage((previous) => {
      release(previous);
      return null;
    });
    setError(null);
  }, []);

  return { image, load, clear, loading, error };
}
