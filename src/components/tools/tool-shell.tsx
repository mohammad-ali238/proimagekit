import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { ComingSoon } from "@/components/tools/coming-soon";
import { Faq } from "@/components/tools/faq";
import { RelatedTools } from "@/components/tools/related-tools";
import { breadcrumbSchema, faqSchema, toolSchema } from "@/lib/structured-data";
import { getRelatedTools, type ToolDefinition } from "@/lib/tools-registry";
import { cn } from "@/lib/utils";

/** Consistent page frame for every tool: heading, tool UI, FAQ, related tools and structured data. */
export function ToolShell({ tool, children, wide = false }: { tool: ToolDefinition; children?: ReactNode; wide?: boolean }) {
  const Icon = tool.icon;

  return (
    <div className={cn("mx-auto px-4 py-10", wide ? "max-w-7xl" : "max-w-5xl")}>
      <JsonLd data={toolSchema(tool)} />
      <JsonLd data={breadcrumbSchema(tool)} />
      {tool.faq.length > 0 && <JsonLd data={faqSchema(tool)} />}

      <header className="flex flex-col items-center text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-6" aria-hidden />
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tool.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{tool.description}</p>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="size-4" aria-hidden />
          Processed on your device — nothing is uploaded
        </p>
      </header>

      <section aria-label={`${tool.name} tool`} className="mt-8">
        {tool.status === "ready" && children ? children : <ComingSoon />}
      </section>

      <div className={cn("mt-16 space-y-16", wide && "mx-auto max-w-5xl")}>
        <Faq items={tool.faq} />
        <RelatedTools tools={getRelatedTools(tool)} />
      </div>
    </div>
  );
}
