import type { Metadata } from "next";
import { ToolArea } from "@/components/tools/tool-area";
import { ToolShell } from "@/components/tools/tool-shell";
import { getTool } from "@/lib/tools-registry";

const tool = getTool("image-editor")!;

export const metadata: Metadata = {
  title: `${tool.title} — Free & Private`,
  description: tool.description,
  keywords: tool.keywords,
  alternates: { canonical: "/editor" },
};

export default function EditorPage() {
  return (
    <ToolShell tool={tool} wide>
      <ToolArea slug={tool.slug} />
    </ToolShell>
  );
}
