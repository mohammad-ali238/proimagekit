"use client";

import type { ReactNode } from "react";
import { SerwistProvider } from "@serwist/turbopack/react";

/** Registers the service worker in production builds only (it would cache stale code during development). */
export function ServiceWorker({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV === "development"} options={{ scope: "/" }}>
      {children}
    </SerwistProvider>
  );
}
