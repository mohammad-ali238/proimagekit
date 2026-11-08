import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { siteConfig } from "@/config/site";
import { getTool } from "@/lib/tools-registry";
import { frontmatterSchema, type Frontmatter } from "./schema";

/**
 * Blog articles live in content/blog as .md or .mdx files with YAML
 * frontmatter. Files starting with "_" (like _template.mdx) are ignored.
 * Everything is read at build time; pages are fully static.
 */

export const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface Post extends Omit<Frontmatter, "slug" | "updatedAt" | "author"> {
  slug: string;
  author: string;
  updatedAt: Date;
  /** "md" files can't contain JSX components. */
  format: "md" | "mdx";
  /** The article body without its frontmatter. */
  content: string;
  readingMinutes: number;
  sourceFile: string;
}

export class BlogContentError extends Error {
  constructor(file: string, message: string) {
    super(`content/blog/${file}: ${message}`);
    this.name = "BlogContentError";
  }
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

/** Parses one article. Pure, so it can be unit tested without the file system. */
export function parsePost(fileName: string, source: string): Post {
  const match = FRONTMATTER.exec(source);
  if (!match) throw new BlogContentError(fileName, "missing frontmatter (a --- block at the top of the file)");

  let data: unknown;
  try {
    data = parseYaml(match[1]) ?? {};
  } catch (error) {
    throw new BlogContentError(fileName, `invalid YAML frontmatter: ${(error as Error).message}`);
  }

  const result = frontmatterSchema.safeParse(data);
  if (!result.success) throw new BlogContentError(fileName, `invalid frontmatter\n${z.prettifyError(result.error)}`);
  const frontmatter = result.data;

  for (const slug of frontmatter.relatedTools) {
    if (!getTool(slug)) throw new BlogContentError(fileName, `relatedTools: unknown tool "${slug}"`);
  }

  const content = source.slice(match[0].length);
  const words = content.replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length;
  const extension = path.extname(fileName).toLowerCase();

  return {
    ...frontmatter,
    slug: frontmatter.slug ?? path.basename(fileName, extension),
    author: frontmatter.author ?? siteConfig.name,
    updatedAt: frontmatter.updatedAt ?? frontmatter.publishedAt,
    format: extension === ".md" ? "md" : "mdx",
    content,
    readingMinutes: Math.max(1, Math.round(words / 220)),
    sourceFile: fileName,
  };
}

/** Reads and validates every article in a folder. Throws on invalid files and duplicate slugs. */
export function readPosts(directory: string = BLOG_DIR): Post[] {
  if (!fs.existsSync(directory)) return [];
  const files = fs
    .readdirSync(directory)
    .filter((file) => /\.mdx?$/i.test(file) && !file.startsWith("_") && !file.startsWith("."));

  const posts = files.map((file) => parsePost(file, fs.readFileSync(path.join(directory, file), "utf8")));
  const seen = new Map<string, string>();
  for (const post of posts) {
    const other = seen.get(post.slug);
    if (other) throw new BlogContentError(post.sourceFile, `slug "${post.slug}" is also used by ${other}`);
    seen.set(post.slug, post.sourceFile);
  }
  return posts;
}

/**
 * Published articles are live once their publish date has passed (checked at
 * build time, so a scheduled article appears on the first deploy after its
 * date). Drafts are only shown by `next dev`, so they can be previewed.
 */
export function isVisible(post: Pick<Post, "status" | "publishedAt">, now = new Date(), showDrafts = false): boolean {
  if (post.status === "draft") return showDrafts;
  return post.publishedAt.getTime() <= now.getTime();
}

/** Newest first, by the last-updated date. */
export function sortByUpdated<T extends Pick<Post, "updatedAt" | "publishedAt">>(posts: T[]): T[] {
  return [...posts].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime() || b.publishedAt.getTime() - a.publishedAt.getTime(),
  );
}

const isDev = process.env.NODE_ENV === "development";
let cache: Post[] | null = null;

/** Every visible article, newest first. Cached for the build; re-read on each request in development. */
export function getPosts(): Post[] {
  if (cache && !isDev) return cache;
  const posts = sortByUpdated(readPosts().filter((post) => isVisible(post, new Date(), isDev)));
  cache = posts;
  return posts;
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((post) => post.slug === slug);
}

export function getLatestPosts(limit = 10): Post[] {
  return getPosts().slice(0, limit);
}

/** Articles that should appear in the sitemap. */
export function getIndexablePosts(): Post[] {
  return getPosts().filter((post) => post.status === "published" && !post.seo.noindex && !post.seo.canonical);
}

export function postUrl(post: Pick<Post, "slug">): string {
  return `/blog/${post.slug}`;
}
