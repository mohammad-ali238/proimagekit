/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import { CacheFirst, ExpirationPlugin, NetworkFirst, Serwist, type PrecacheEntry, type SerwistGlobalConfig } from "serwist";

/**
 * Service worker: makes the site installable and lets every tool work offline
 * after the first visit. All pages and static assets are precached at install;
 * the WebAssembly codecs and the large HEIC decoder are cached on first use.
 * Bundled by src/app/serwist/[path]/route.ts.
 */

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Web worker scripts (the image codecs). Turbopack passes a worker its
      // config in the script URL's #fragment, which a cached response loses,
      // so they're kept out of the precache and fetched network-first.
      matcher: ({ request }) => request.destination === "worker",
      handler: new NetworkFirst({ cacheName: "worker-scripts" }),
    },
    {
      matcher: /\.wasm$/i,
      handler: new CacheFirst({
        cacheName: "wasm-codecs",
        plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 30 })],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [{ url: "/~offline", matcher: ({ request }) => request.destination === "document" }],
  },
});

serwist.addEventListeners();
