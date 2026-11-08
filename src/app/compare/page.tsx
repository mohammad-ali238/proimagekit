import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { siteConfig } from "@/config/site";
import { categories, categoryOrder, getToolHref, getToolsByCategory } from "@/lib/tools-registry";

export const metadata: Metadata = {
  title: "Compare all image tools",
  description: `Every ${siteConfig.name} tool side by side: what it does, batch support, output formats and key features. All free and private.`,
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Compare all tools</h1>
        <p className="mt-3 text-muted-foreground">
          Every tool is free, works in your browser and never uploads your images. Here&apos;s what each one does.
        </p>
      </header>

      <div className="mt-10 space-y-12">
        {categoryOrder.map((category) => (
          <section key={category} aria-labelledby={`compare-${category}`}>
            <h2 id={`compare-${category}`} className="text-xl font-semibold">
              {categories[category].label}
            </h2>
            <div className="mt-4 overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[44rem] text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th scope="col" className="w-48 px-4 py-3 font-medium">
                      Tool
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      What it does
                    </th>
                    <th scope="col" className="w-20 px-4 py-3 text-center font-medium">
                      Batch
                    </th>
                    <th scope="col" className="w-44 px-4 py-3 font-medium">
                      Output
                    </th>
                    <th scope="col" className="w-60 px-4 py-3 font-medium">
                      Highlights
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {getToolsByCategory(category).map((tool) => (
                    <tr key={tool.slug} className="align-top">
                      <th scope="row" className="px-4 py-3 text-left font-medium">
                        <Link href={getToolHref(tool)} className="text-primary underline-offset-4 hover:underline">
                          {tool.name}
                        </Link>
                      </th>
                      <td className="px-4 py-3 text-muted-foreground">{tool.description}</td>
                      <td className="px-4 py-3 text-center">
                        {tool.batch ? (
                          <Check className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" aria-label="Yes" />
                        ) : (
                          <Minus className="mx-auto size-4 text-muted-foreground" aria-label="No" />
                        )}
                      </td>
                      <td className="px-4 py-3">{tool.output}</td>
                      <td className="px-4 py-3">
                        <ul className="space-y-1 text-muted-foreground">
                          {tool.highlights.map((highlight) => (
                            <li key={highlight}>{highlight}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
