import { getTool } from "@/lib/tools-registry";
import { ogContentType, ogSize, renderOgImage } from "@/lib/og";
import { ogIconData } from "@/lib/og-icons";

const tool = getTool("image-editor")!;

export const alt = tool.title;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({ title: tool.title, description: tool.description, icon: ogIconData(tool.icon) });
}
