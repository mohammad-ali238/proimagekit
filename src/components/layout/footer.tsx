import Link from "next/link";
import { siteConfig } from "@/config/site";
import { categories, categoryOrder, getToolHref, getToolsByCategory } from "@/lib/tools-registry";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <p className="font-semibold">{siteConfig.name}</p>
          <p className="mt-2 text-sm text-muted-foreground">{siteConfig.tagline}.</p>
        </div>
        {categoryOrder.map((category) => (
          <div key={category}>
            <p className="text-sm font-medium">{categories[category].label}</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {getToolsByCategory(category).map((tool) => (
                <li key={tool.slug}>
                  <Link href={getToolHref(tool)} className="hover:text-foreground">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t px-4 py-4 text-center text-xs text-muted-foreground">
        <span>
          © {new Date().getFullYear()} {siteConfig.name}. All processing happens in your browser.
        </span>
        <Link href="/compare" className="hover:text-foreground">
          Compare tools
        </Link>
        <Link href="/privacy" className="hover:text-foreground">
          Privacy
        </Link>
      </div>
    </footer>
  );
}
