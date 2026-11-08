import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getIndexablePosts, postUrl } from "@/lib/blog/posts";
import { getToolHref, tools } from "@/lib/tools-registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const url = (path: string) => `${siteConfig.url}${path === "/" ? "" : path}`;

  return [
    { url: url("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    ...tools
      .filter((tool) => tool.status === "ready")
      .map((tool) => ({
        url: url(getToolHref(tool)),
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
    ...getIndexablePosts().map((post) => ({
      url: url(postUrl(post)),
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: url("/compare"), lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: url("/privacy"), lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
