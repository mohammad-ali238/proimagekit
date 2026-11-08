/**
 * Site-wide branding and URLs. The name and domain are placeholders — change
 * them here (and set NEXT_PUBLIC_SITE_URL in the deploy environment).
 */
export const siteConfig = {
  name: "ProImageKit",
  tagline: "Free image tools that never upload your files",
  description:
    "Convert, compress, resize, crop and edit images right in your browser. Every file stays on your device — nothing is ever uploaded.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "en_US",
} as const;

export const navLinks = [
  { href: "/", label: "All tools" },
  { href: "/editor", label: "Editor" },
  { href: "/compare", label: "Compare" },
] as const;
