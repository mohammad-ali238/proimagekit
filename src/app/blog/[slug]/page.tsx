import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, Clock, PencilLine } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolCard } from "@/components/tools/tool-card";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { getPost, getPosts, postUrl, type Post } from "@/lib/blog/posts";
import { renderPost } from "@/lib/blog/render";
import { blogBreadcrumbSchema, blogPostingSchema } from "@/lib/structured-data";
import { getTool, type ToolDefinition } from "@/lib/tools-registry";

// Only articles in content/blog exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

/** Social image: seo.ogImage, then the cover image, then a generated card. */
function socialImage(post: Post): string {
  return post.seo.ogImage ?? post.coverImage ?? `/og/blog/${post.slug}`;
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  const title = post.seo.title ?? post.title;
  const description = post.seo.description ?? post.description;
  const image = socialImage(post);
  const hidden = post.status === "draft" || post.seo.noindex;

  return {
    title,
    description,
    keywords: [...post.tags, ...post.seo.keywords],
    authors: [{ name: post.author }],
    alternates: { canonical: post.seo.canonical ?? postUrl(post) },
    robots: hidden ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "article",
      title,
      description,
      url: postUrl(post),
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author],
      tags: post.tags,
      images: [{ url: image, width: 1200, height: 630, alt: post.coverAlt ?? post.title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const content = await renderPost(post);
  const updated = post.updatedAt.getTime() !== post.publishedAt.getTime();
  const tools = post.relatedTools.map((toolSlug) => getTool(toolSlug)).filter((tool): tool is ToolDefinition => !!tool);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd data={blogPostingSchema(post, socialImage(post))} />
      <JsonLd data={blogBreadcrumbSchema(post)} />

      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          {siteConfig.name}
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <span aria-current="page" className="truncate">
          {post.title}
        </span>
      </nav>

      {post.status === "draft" && (
        <p role="note" className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          <PencilLine className="mr-1.5 inline size-4" aria-hidden />
          Draft preview — only visible in development. Set <code>status: published</code> to publish it.
        </p>
      )}

      <header>
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{post.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{post.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>By {post.author}</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-4" aria-hidden />
            <time dateTime={post.publishedAt.toISOString()}>{dateFormat.format(post.publishedAt)}</time>
          </span>
          {updated && (
            <span>
              Updated <time dateTime={post.updatedAt.toISOString()}>{dateFormat.format(post.updatedAt)}</time>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="size-4" aria-hidden /> {post.readingMinutes} min read
          </span>
        </div>
        {post.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
            {post.tags.map((tag) => (
              <li key={tag}>
                <Badge variant="secondary">{tag}</Badge>
              </li>
            ))}
          </ul>
        )}
      </header>

      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element -- author-supplied image of unknown size
        <img src={post.coverImage} alt={post.coverAlt ?? ""} className="mt-8 w-full rounded-xl border" fetchPriority="high" />
      )}

      <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-a:text-primary prose-img:mx-auto prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none">
        {content}
      </div>

      {tools.length > 0 && (
        <section aria-labelledby="try-heading" className="mt-12 border-t pt-8">
          <h2 id="try-heading" className="text-xl font-semibold">
            Try it yourself
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {tools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
