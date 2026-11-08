import Link from "next/link";
import { ShieldCheck, SwatchBook } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { navLinks, siteConfig } from "@/config/site";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <SwatchBook className="size-5 text-primary" aria-hidden />
          {siteConfig.name}
        </Link>
        <nav aria-label="Main" className="ml-2 hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1 text-xs text-muted-foreground md:flex">
            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
            Files never leave your device
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
