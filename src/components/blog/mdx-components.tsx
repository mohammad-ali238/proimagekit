import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import type { MDXComponents } from "mdx/types";
import { ToolCard as RegistryToolCard } from "@/components/tools/tool-card";
import { getTool } from "@/lib/tools-registry";
import { cn } from "@/lib/utils";

function SmartLink({ href = "", children, ...props }: ComponentPropsWithoutRef<"a">) {
  // Same-site links use client-side navigation; external links open in a new tab.
  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}

function ArticleImage({ alt = "", ...props }: ComponentPropsWithoutRef<"img">) {
  // eslint-disable-next-line @next/next/no-img-element -- content images have unknown sizes; lazy-loaded
  return <img alt={alt} loading="lazy" decoding="async" className="rounded-lg border" {...props} />;
}

function Table(props: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
  );
}

const calloutStyles = {
  tip: { icon: Lightbulb, className: "border-emerald-500/40 bg-emerald-500/10" },
  info: { icon: Info, className: "border-primary/40 bg-primary/10" },
  warning: { icon: AlertTriangle, className: "border-amber-500/40 bg-amber-500/10" },
};

/** Usage in .mdx: <Callout type="tip">Text</Callout> — type is "tip", "info" or "warning". */
function Callout({ type = "info", children }: { type?: keyof typeof calloutStyles; children: ReactNode }) {
  const { icon: Icon, className } = calloutStyles[type] ?? calloutStyles.info;
  return (
    <aside className={cn("not-prose my-6 flex gap-3 rounded-xl border p-4 text-sm", className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="[&>p]:m-0">{children}</div>
    </aside>
  );
}

/** Usage in .mdx: <ToolCard slug="watermark-adder" /> — shows a link card to one of the site's tools. */
function ToolCard({ slug }: { slug: string }) {
  const tool = getTool(slug);
  if (!tool) throw new Error(`<ToolCard slug="${slug}"> — no tool with that slug`);
  return (
    <div className="not-prose my-6 max-w-sm">
      <RegistryToolCard tool={tool} />
    </div>
  );
}

export const mdxComponents: MDXComponents = {
  a: SmartLink,
  img: ArticleImage,
  table: Table,
  Callout,
  ToolCard,
};
