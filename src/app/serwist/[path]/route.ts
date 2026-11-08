import { createSerwistRoute } from "@serwist/turbopack";
import { getPosts, postUrl } from "@/lib/blog/posts";
import { getRoutedTools } from "@/lib/tools-registry";

/**
 * Builds and serves the service worker (/serwist/sw.js) at build time.
 * Every page is precached so all tools work offline once the site has loaded.
 * Pages are revisioned by the build, so a new deploy refreshes them.
 */
const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.BUILD_ID ?? crypto.randomUUID();

const pages = [
  "/",
  "/editor",
  "/compare",
  "/privacy",
  "/~offline",
  ...getRoutedTools().map((tool) => `/tools/${tool.slug}`),
  ...getPosts().map(postUrl),
];

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  additionalPrecacheEntries: pages.map((url) => ({ url, revision })),
  // Precache everything up to 2.5 MB; bigger files (the HEIC decoder) are cached on first use.
  maximumFileSizeToCacheInBytes: 2.5 * 1024 * 1024,
  esbuildOptions: { sourcemap: false },
  // See the worker-script rule in sw.ts.
  globIgnores: ["**/turbopack-worker-*.js"],
});
