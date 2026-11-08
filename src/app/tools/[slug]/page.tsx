import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolArea } from "@/components/tools/tool-area";
import { ToolShell } from "@/components/tools/tool-shell";
import { siteConfig } from "@/config/site";
import { getRoutedTools, getTool, getToolHref } from "@/lib/tools-registry";

// Only registered tools exist; any other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getRoutedTools().map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tools/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};

  const title = `${tool.title} — Free & Private`;
  const description = `${tool.description} Free, no sign-up, and your files never leave your device.`;

  return {
    title,
    description,
    keywords: tool.keywords,
    alternates: { canonical: getToolHref(tool) },
    openGraph: { title: `${title} | ${siteConfig.name}`, description, url: getToolHref(tool) },
    twitter: { title: `${title} | ${siteConfig.name}`, description },
  };
}

export default async function ToolPage({ params }: PageProps<"/tools/[slug]">) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool || tool.href) notFound();

  return (
    <ToolShell tool={tool}>
      <ToolArea slug={tool.slug} />
    </ToolShell>
  );
}
