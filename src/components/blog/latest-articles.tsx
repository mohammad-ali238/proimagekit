import Link from "next/link";
import { Newspaper } from "lucide-react";
import { getLatestPosts, postUrl } from "@/lib/blog/posts";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** The 10 most recently updated articles, shown above the footer on every page. */
export function LatestArticles() {
  const posts = getLatestPosts(10);
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="latest-articles-heading" className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h2 id="latest-articles-heading" className="flex items-center gap-2 text-lg font-semibold">
          <Newspaper className="size-5 text-primary" aria-hidden /> Latest articles
        </h2>
        <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
          {posts.map((post) => (
            <li key={post.slug} className="flex items-baseline justify-between gap-3 text-sm">
              <Link href={postUrl(post)} className="line-clamp-1 hover:text-primary hover:underline">
                {post.title}
              </Link>
              <time dateTime={post.updatedAt.toISOString()} className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {dateFormat.format(post.updatedAt)}
              </time>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
