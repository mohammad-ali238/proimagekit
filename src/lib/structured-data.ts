import { siteConfig } from "@/config/site";
import { postUrl, type Post } from "@/lib/blog/posts";
import { categories, getToolHref, type ToolDefinition } from "@/lib/tools-registry";

export function faqSchema(tool: ToolDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function toolSchema(tool: ToolDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    description: tool.description,
    url: `${siteConfig.url}${getToolHref(tool)}`,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any (runs in the browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

export function breadcrumbSchema(tool: ToolDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Tools", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: categories[tool.category].label, item: `${siteConfig.url}/#${tool.category}` },
      { "@type": "ListItem", position: 3, name: tool.name, item: `${siteConfig.url}${getToolHref(tool)}` },
    ],
  };
}

export function blogPostingSchema(post: Post, image: string) {
  const url = `${siteConfig.url}${postUrl(post)}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo.description ?? post.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: image.startsWith("http") ? image : `${siteConfig.url}${image}`,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": post.author === siteConfig.name ? "Organization" : "Person", name: post.author },
    publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    keywords: [...post.tags, ...post.seo.keywords].join(", ") || undefined,
  };
}

export function blogBreadcrumbSchema(post: Post) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: post.title, item: `${siteConfig.url}${postUrl(post)}` },
    ],
  };
}
