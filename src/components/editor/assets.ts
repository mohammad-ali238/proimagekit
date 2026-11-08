"use client";

import { useEffect, useState } from "react";
import { decodeImage } from "@/lib/image/decode";
import { displayUrl } from "@/lib/image/display";
import { fitCanvasLimits } from "@/lib/image/limits";

/**
 * Images used by the editor. Object URLs stay alive for the whole session so
 * undo can bring back deleted images; they're all released when the editor closes.
 */
const urls = new Set<string>();
const loaded = new Map<string, Promise<HTMLImageElement>>();

export async function importImage(file: File): Promise<{ src: string; width: number; height: number; downscaled: boolean }> {
  const { bitmap, format } = await decodeImage(file);
  try {
    const size = fitCanvasLimits(bitmap.width, bitmap.height);
    const src = await displayUrl(file, format, bitmap, size);
    urls.add(src);
    return { src, width: size.width, height: size.height, downscaled: size.scaled };
  } finally {
    bitmap.close();
  }
}

export function releaseAssets(): void {
  for (const url of urls) URL.revokeObjectURL(url);
  urls.clear();
  loaded.clear();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  let promise = loaded.get(src);
  if (!promise) {
    promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Couldn't load image."));
      image.src = src;
    });
    loaded.set(src, promise);
  }
  return promise;
}

/** The loaded <img> for an asset URL, or undefined while it loads. */
export function useAssetImage(src: string): HTMLImageElement | undefined {
  const [image, setImage] = useState<{ src: string; element: HTMLImageElement }>();
  useEffect(() => {
    let active = true;
    loadImage(src).then(
      (element) => active && setImage({ src, element }),
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [src]);
  return image?.src === src ? image.element : undefined;
}
