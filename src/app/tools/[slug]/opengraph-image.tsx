import { getRoutedTools, getTool } from "@/lib/tools-registry";
import { ogContentType, ogSize, renderOgImage } from "@/lib/og";
import { ogIconData } from "@/lib/og-icons";

export const alt = "Tool preview";
export const size = ogSize;
export const contentType = ogContentType;

export function generateStaticParams() {
  return getRoutedTools().map((tool) => ({ slug: tool.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  return renderOgImage({
    title: tool?.title ?? "Image tools",
    description: tool?.description ?? "",
    icon: tool ? ogIconData(tool.icon) : undefined,
  });
}
