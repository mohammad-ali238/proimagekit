import { Lock, WifiOff, Zap } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolCard } from "@/components/tools/tool-card";
import { siteConfig } from "@/config/site";
import { categories, categoryOrder, getToolsByCategory } from "@/lib/tools-registry";

const highlights = [
  { icon: Lock, title: "100% private", text: "Images are processed on your device and never uploaded." },
  { icon: Zap, title: "Fast", text: "No upload or download wait — results appear instantly." },
  { icon: WifiOff, title: "Works offline", text: "Once loaded, the tools keep working without a connection." },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteConfig.name,
          url: siteConfig.url,
          description: siteConfig.description,
        }}
      />

      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Image tools that <span className="text-primary">never upload</span> your files
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{siteConfig.description}</p>
        <ul className="mt-8 grid gap-4 text-left sm:grid-cols-3">
          {highlights.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3 rounded-xl border p-4">
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-16 space-y-14">
        {categoryOrder.map((category) => (
          <section key={category} id={category} aria-labelledby={`${category}-heading`} className="scroll-mt-20">
            <h2 id={`${category}-heading`} className="text-2xl font-semibold">
              {categories[category].label}
            </h2>
            <p className="mt-1 text-muted-foreground">{categories[category].description}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {getToolsByCategory(category).map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
