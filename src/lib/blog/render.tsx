import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "@/components/blog/mdx-components";
import type { Post } from "./posts";

/**
 * Compiles an article to React at build time (pages are static, so nothing
 * is compiled in the visitor's browser). GitHub-flavoured Markdown (tables,
 * task lists, strikethrough) is enabled and headings get linkable ids.
 */
export async function renderPost(post: Pick<Post, "content" | "format" | "sourceFile">) {
  try {
    const { default: Content } = await evaluate(post.content, {
      ...runtime,
      format: post.format,
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap", properties: { className: ["heading-anchor"] } }]],
    });
    return <Content components={mdxComponents} />;
  } catch (error) {
    throw new Error(`content/blog/${post.sourceFile}: couldn't compile the article — ${(error as Error).message}`);
  }
}
