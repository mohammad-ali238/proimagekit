"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

interface CompareSliderProps {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}

/**
 * Before/after comparison. Both images are stacked; the "after" image is
 * clipped to the divider. A native range input drives it, so it works with
 * the keyboard, touch and screen readers.
 */
export function CompareSlider({ before, after, beforeLabel = "Original", afterLabel = "Result" }: CompareSliderProps) {
  const [position, setPosition] = useState(50);
  const [beforeFailed, setBeforeFailed] = useState(false);
  const id = useId();

  return (
    <div className="relative select-none overflow-hidden rounded-lg bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:20px_20px]">
      {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL */}
      <img
        src={beforeFailed ? after : before}
        alt={beforeLabel}
        className={cn("block max-h-[60vh] w-full object-contain", beforeFailed && "invisible")}
        draggable={false}
        onError={() => setBeforeFailed(true)}
      />
      {beforeFailed && (
        <p className="absolute inset-y-0 left-0 flex w-1/2 items-center justify-center px-4 text-center text-sm text-muted-foreground">
          Your browser can&apos;t display the original.
        </p>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL */}
      <img
        src={after}
        alt={afterLabel}
        className="absolute inset-0 h-full w-full object-contain"
        style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        draggable={false}
      />
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.3)]" style={{ left: `${position}%` }}>
        <span className="absolute top-1/2 left-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-background text-xs shadow">
          ⇆
        </span>
      </div>
      <span className="pointer-events-none absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">{beforeLabel}</span>
      <span className="pointer-events-none absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">{afterLabel}</span>
      <label htmlFor={id} className="sr-only">
        Comparison position
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
