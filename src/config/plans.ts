/**
 * Usage limits. Everything is free for now; these limits exist so a paid
 * plan can be switched on later without touching the tools.
 */
export const freeLimits = {
  maxBatchFiles: 20,
} as const;

export const proLimits = {
  maxBatchFiles: 500,
} as const;

export type PlanLimits = { maxBatchFiles: number };
