import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { BLOG_DIR, BlogContentError, isVisible, parsePost, readPosts, sortByUpdated } from "@/lib/blog/posts";

const post = (frontmatter: string, body = "Hello world.") => `---\n${frontmatter}\n---\n${body}`;
const minimal = "title: A title\ndescription: A description.\nstatus: published\npublishedAt: 2026-01-15";

describe("parsePost", () => {
  it("parses frontmatter, applies defaults and derives the slug from the file name", () => {
    const parsed = parsePost("my-first-post.mdx", post(minimal, "one two three four"));
    expect(parsed.slug).toBe("my-first-post");
    expect(parsed.format).toBe("mdx");
    expect(parsed.publishedAt.toISOString()).toBe("2026-01-15T00:00:00.000Z");
    expect(parsed.updatedAt).toEqual(parsed.publishedAt);
    expect(parsed.tags).toEqual([]);
    expect(parsed.seo).toEqual({ keywords: [], noindex: false });
    expect(parsed.content.trim()).toBe("one two three four");
    expect(parsed.readingMinutes).toBe(1);
  });

  it("treats .md files as plain Markdown", () => {
    expect(parsePost("note.md", post(minimal)).format).toBe("md");
  });

  it("uses the slug and SEO overrides from frontmatter", () => {
    const parsed = parsePost(
      "file-name.mdx",
      post(`${minimal}\nslug: custom-slug\nupdatedAt: 2026-02-01\nseo:\n  title: SEO title\n  noindex: true`),
    );
    expect(parsed.slug).toBe("custom-slug");
    expect(parsed.updatedAt.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(parsed.seo.title).toBe("SEO title");
    expect(parsed.seo.noindex).toBe(true);
  });

  it.each([
    ["missing frontmatter", "No frontmatter here", /missing frontmatter/],
    ["missing title", post("description: x\nstatus: published\npublishedAt: 2026-01-01"), /title/],
    ["bad status", post(minimal.replace("published", "live")), /status/],
    ["bad date", post(minimal.replace("2026-01-15", "someday")), /publishedAt/],
    ["typo in a field name", post(`${minimal}\npubishedAt: 2026-01-01`), /pubishedAt/],
    ["cover without alt text", post(`${minimal}\ncoverImage: /x.jpg`), /coverAlt/],
    ["updated before published", post(`${minimal}\nupdatedAt: 2025-01-01`), /updatedAt/],
    ["invalid slug", post(`${minimal}\nslug: Not A Slug`), /slug/],
    ["unknown related tool", post(`${minimal}\nrelatedTools: [does-not-exist]`), /unknown tool/],
    ["broken YAML", post("title: [unclosed"), /invalid YAML/],
  ])("rejects %s with a helpful error", (_case, source, message) => {
    expect(() => parsePost("broken.mdx", source)).toThrow(BlogContentError);
    expect(() => parsePost("broken.mdx", source)).toThrow(message);
  });

  it("names the file in errors", () => {
    expect(() => parsePost("oops.mdx", "nothing")).toThrow("content/blog/oops.mdx");
  });
});

describe("visibility and ordering", () => {
  const now = new Date("2026-06-01T12:00:00Z");

  it("shows published articles once their date has passed", () => {
    expect(isVisible({ status: "published", publishedAt: new Date("2026-05-01") }, now)).toBe(true);
    expect(isVisible({ status: "published", publishedAt: new Date("2026-07-01") }, now)).toBe(false);
  });

  it("shows drafts only when previewing", () => {
    expect(isVisible({ status: "draft", publishedAt: new Date("2026-05-01") }, now, false)).toBe(false);
    expect(isVisible({ status: "draft", publishedAt: new Date("2026-05-01") }, now, true)).toBe(true);
  });

  it("sorts by last update, newest first", () => {
    const a = { slug: "a", publishedAt: new Date("2026-01-01"), updatedAt: new Date("2026-05-01") };
    const b = { slug: "b", publishedAt: new Date("2026-03-01"), updatedAt: new Date("2026-03-01") };
    const c = { slug: "c", publishedAt: new Date("2026-04-01"), updatedAt: new Date("2026-05-01") };
    expect(sortByUpdated([a, b, c]).map((p) => p.slug)).toEqual(["c", "a", "b"]);
  });
});

describe("readPosts", () => {
  let dir: string;
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("reads .md and .mdx files and skips templates and other files", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-"));
    fs.writeFileSync(path.join(dir, "one.mdx"), post(minimal));
    fs.writeFileSync(path.join(dir, "two.md"), post(minimal));
    fs.writeFileSync(path.join(dir, "_template.mdx"), "not even valid");
    fs.writeFileSync(path.join(dir, "notes.txt"), "ignored");
    expect(readPosts(dir).map((p) => p.slug).sort()).toEqual(["one", "two"]);
  });

  it("rejects duplicate slugs", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-"));
    fs.writeFileSync(path.join(dir, "one.mdx"), post(minimal));
    fs.writeFileSync(path.join(dir, "two.mdx"), post(`${minimal}\nslug: one`));
    expect(() => readPosts(dir)).toThrow(/slug "one" is also used by/);
  });

  it("returns nothing when the folder doesn't exist", () => {
    dir = path.join(os.tmpdir(), "no-such-blog-dir");
    expect(readPosts(dir)).toEqual([]);
  });
});

describe("the real content folder", () => {
  it("has only valid articles", () => {
    expect(() => readPosts(BLOG_DIR)).not.toThrow();
  });

  it("keeps the template valid, so copying it always works", () => {
    const template = fs.readFileSync(path.join(BLOG_DIR, "_template.mdx"), "utf8");
    expect(() => parsePost("_template.mdx", template)).not.toThrow();
  });
});
