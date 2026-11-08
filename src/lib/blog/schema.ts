import { z } from "zod";

/**
 * Frontmatter for files in content/blog. Unknown keys are rejected so typos
 * (e.g. "pubishedAt") fail the build instead of being silently ignored.
 * See content/blog/_template.mdx for an annotated example of every field.
 */

// YAML turns unquoted dates into Date objects; quoted ones stay strings.
const date = z.coerce.date({ error: "must be a date like 2026-09-29 or 2026-09-29T14:30:00Z" });

export const seoSchema = z
  .object({
    /** Overrides the <title>; defaults to `title`. */
    title: z.string().min(1).max(70).optional(),
    /** Overrides the meta description; defaults to `description`. */
    description: z.string().min(1).max(170).optional(),
    keywords: z.array(z.string()).default([]),
    /** Absolute URL, only when the article was first published elsewhere. */
    canonical: z.url().optional(),
    /** Hide from search engines and the sitemap (the page still works). */
    noindex: z.boolean().default(false),
    /** Custom social image (path in /public or absolute URL); defaults to coverImage, then a generated image. */
    ogImage: z.string().optional(),
  })
  .strict();

export const frontmatterSchema = z
  .object({
    title: z.string().min(1).max(120),
    /** Used as meta description and summary; aim for 120–160 characters. */
    description: z.string().min(1).max(300),
    /** URL slug; defaults to the file name. */
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "use lowercase letters, numbers and single hyphens")
      .optional(),
    status: z.enum(["published", "draft"]),
    publishedAt: date,
    /** Last meaningful update; defaults to publishedAt. Articles are listed by this date. */
    updatedAt: date.optional(),
    author: z.string().min(1).optional(),
    tags: z.array(z.string().min(1)).default([]),
    /** Image shown at the top of the article, e.g. /blog/my-post/cover.jpg (put files in public/blog). */
    coverImage: z.string().optional(),
    coverAlt: z.string().optional(),
    /** Tool slugs from the tools registry, shown as "Try it" cards after the article. */
    relatedTools: z.array(z.string()).default([]),
    seo: seoSchema.prefault({}),
  })
  .strict()
  .refine((data) => !data.coverImage || !!data.coverAlt, { message: "coverAlt is required when coverImage is set", path: ["coverAlt"] })
  .refine((data) => !data.updatedAt || data.updatedAt >= data.publishedAt, {
    message: "updatedAt can't be before publishedAt",
    path: ["updatedAt"],
  });

export type Frontmatter = z.infer<typeof frontmatterSchema>;
