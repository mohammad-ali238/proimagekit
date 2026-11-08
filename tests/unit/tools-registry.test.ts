import { describe, expect, it } from "vitest";
import { categoryOrder, getRelatedTools, getRoutedTools, getTool, getToolHref, tools } from "@/lib/tools-registry";
import { faqSchema } from "@/lib/structured-data";

describe("tools registry", () => {
  it("has unique slugs", () => {
    const slugs = tools.map((tool) => tool.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses URL-safe slugs", () => {
    for (const tool of tools) expect(tool.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("only references related tools that exist and are not itself", () => {
    for (const tool of tools) {
      for (const slug of tool.related) {
        expect(getTool(slug), `${tool.slug} → ${slug}`).toBeDefined();
        expect(slug).not.toBe(tool.slug);
      }
      expect(getRelatedTools(tool)).toHaveLength(tool.related.length);
    }
  });

  it("puts every tool in a known category", () => {
    for (const tool of tools) expect(categoryOrder).toContain(tool.category);
  });

  it("gives every tool SEO content and at least one FAQ", () => {
    for (const tool of tools) {
      expect(tool.title.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeLessThanOrEqual(160);
      expect(tool.keywords.length).toBeGreaterThan(0);
      expect(tool.faq.length).toBeGreaterThan(0);
    }
  });

  it("routes tools under /tools unless they declare their own href", () => {
    expect(getToolHref(getTool("heic-to-jpg")!)).toBe("/tools/heic-to-jpg");
    expect(getToolHref(getTool("image-editor")!)).toBe("/editor");
    expect(getRoutedTools().some((tool) => tool.slug === "image-editor")).toBe(false);
  });

  it("does not include PDF tools", () => {
    expect(tools.some((tool) => tool.slug.includes("pdf"))).toBe(false);
  });
});

describe("FAQ structured data", () => {
  it("maps every FAQ item to a schema.org Question", () => {
    const tool = getTool("heic-to-jpg")!;
    const schema = faqSchema(tool);
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity).toHaveLength(tool.faq.length);
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe(tool.faq[0].answer);
  });
});
