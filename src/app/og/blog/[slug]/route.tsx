import { getPost, getPosts } from "@/lib/blog/posts";
import { renderOgImage } from "@/lib/og";

/** Generated social image for articles without a cover or custom ogImage. Built at build time. */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export async function GET(_request: Request, { params }: RouteContext<"/og/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return new Response("Not found", { status: 404 });
  return renderOgImage({ title: post.title, description: post.description });
}
