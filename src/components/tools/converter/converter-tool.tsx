"use client";

import { useMemo, useState } from "react";
import { BatchWorkspace } from "@/components/tools/batch/batch-workspace";
import { useImageQueue } from "@/hooks/use-image-queue";
import { convertImage, type ConvertOptions } from "@/lib/image/convert";
import { acceptFor, formatInfo, formatList } from "@/lib/image/formats";
import { getTool } from "@/lib/tools-registry";
import { ConverterOptions } from "./converter-options";

export default function ConverterTool({ slug }: { slug: string }) {
  const converter = getTool(slug)?.converter;
  if (!converter) throw new Error(`Tool "${slug}" has no converter config.`);

  const [options, setOptions] = useState<ConvertOptions>({
    format: converter.to === "choose" ? "webp" : converter.to,
    quality: 90,
    background: "#ffffff",
  });
  const queue = useImageQueue(options, convertImage);
  const accept = useMemo(() => acceptFor(converter.from), [converter.from]);

  return (
    <div className="space-y-4">
      <ConverterOptions options={options} onChange={setOptions} chooseFormat={converter.to === "choose"} />
      <BatchWorkspace
        queue={queue}
        accept={accept}
        formatsLabel={formatList(converter.from)}
        verb={{ active: "Converting", past: "converted" }}
        zipName={`converted-${formatInfo[options.format].extension}-images.zip`}
      />
    </div>
  );
}
