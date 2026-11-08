"use client";

import { useProModal } from "@/components/pro/pro-modal";
import { freeLimits, proLimits, type PlanLimits } from "@/config/plans";

/**
 * Stub for the future paid plan. Always free for now; later this will read
 * the user's subscription status. Tools call `requirePro` when a free limit
 * is reached, which shows the upgrade dialog.
 */
export function useProGate(): { isPro: boolean; limits: PlanLimits; requirePro: (reason: string) => void } {
  const isPro = false;
  const requirePro = useProModal((state) => state.show);
  return { isPro, limits: isPro ? proLimits : freeLimits, requirePro };
}
