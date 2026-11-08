"use client";

import { Check, Sparkles } from "lucide-react";
import { create } from "zustand";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { proLimits } from "@/config/plans";

interface ProModalState {
  reason: string | null;
  show: (reason: string) => void;
  hide: () => void;
}

/** Opened by `useProGate().requirePro(reason)` whenever a free limit is reached. */
export const useProModal = create<ProModalState>()((set) => ({
  reason: null,
  show: (reason) => set({ reason }),
  hide: () => set({ reason: null }),
}));

const perks = [
  `Process up to ${proLimits.maxBatchFiles} images at once`,
  "Save your favourite settings as presets",
  "Support an ad-free, privacy-first tool",
];

/**
 * Upgrade prompt. There's no payment yet — this is a stub so the limit and
 * upsell flow are in place when a paid plan launches.
 */
export function ProModal() {
  const reason = useProModal((state) => state.reason);
  const hide = useProModal((state) => state.hide);

  return (
    <Dialog open={reason !== null} onOpenChange={(open) => !open && hide()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden /> Pro is coming soon
          </DialogTitle>
          <DialogDescription>{reason}</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {perks.map((perk) => (
            <li key={perk} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              {perk}
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button onClick={hide}>Keep using the free version</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
