"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, ImagePlus, MapPin, ShieldCheck, ShieldOff } from "lucide-react";
import { SingleImagePicker } from "@/components/tools/single-image-picker";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useSingleImage } from "@/hooks/use-single-image";
import { formatBytes, formatDimensions } from "@/lib/format";
import { formatInfo } from "@/lib/image/formats";
import { readMetadata, summarizeMetadata, type MetadataGroup, type MetadataSummary } from "@/lib/image/metadata";

function MetadataTable({ group }: { group: MetadataGroup }) {
  return (
    <table className="w-full text-sm">
      <tbody className="divide-y">
        {group.rows.map((row) => (
          <tr key={row.label}>
            <th scope="row" className="w-2/5 py-1.5 pr-3 text-left align-top font-normal text-muted-foreground">
              {row.label}
            </th>
            <td className="py-1.5 break-words">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function MetadataViewerTool() {
  const { image, load, clear, loading, error } = useSingleImage();
  const [summary, setSummary] = useState<MetadataSummary | null>(null);

  const open = async (file: File) => {
    setSummary(null);
    const [tags] = await Promise.all([readMetadata(file), load(file)]);
    setSummary(summarizeMetadata(tags));
  };

  if (!image || !summary) return <SingleImagePicker onFile={(file) => void open(file)} loading={loading || (!!image && !summary)} error={error} />;

  const { gps } = summary;
  const coordinates = gps ? `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}` : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL */}
        <img src={image.url} alt="" className="size-20 rounded-md border object-cover" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="truncate font-medium">{image.file.name}</p>
          <p className="text-muted-foreground">
            {image.format ? formatInfo[image.format].label : "Image"} · {formatBytes(image.file.size)} ·{" "}
            {formatDimensions(image.width, image.height)}
          </p>
        </div>
        <Button variant="ghost" onClick={clear}>
          <ImagePlus /> Other image
        </Button>
      </div>

      {summary.sensitive.length > 0 ? (
        <div role="alert" className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="flex items-center gap-2 font-medium">
            <ShieldOff className="size-5 text-amber-600 dark:text-amber-400" aria-hidden />
            This photo contains personal information
          </p>
          <div className="flex flex-wrap gap-1.5">
            {summary.sensitive.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
          {gps && (
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <MapPin className="size-4" aria-hidden /> Taken at <span className="font-mono">{coordinates}</span>
              {gps.altitude !== undefined && <span className="text-muted-foreground">· {Math.round(gps.altitude)} m altitude</span>}
              <a
                href={`https://www.openstreetmap.org/?mlat=${gps.latitude}&mlon=${gps.longitude}#map=16/${gps.latitude}/${gps.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              >
                View on map <ExternalLink className="size-3" aria-hidden />
              </a>
            </p>
          )}
          <Link href="/tools/exif-remover" className={buttonVariants({ size: "sm" })}>
            <ShieldOff /> Remove all metadata
          </Link>
        </div>
      ) : (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
          <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
          No location, camera or author details found in this image.
        </p>
      )}

      {summary.groups.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {summary.groups.map((group) => (
            <section key={group.id} className="rounded-xl border bg-card p-4">
              <h2 className="mb-2 text-sm font-semibold">{group.title}</h2>
              <MetadataTable group={group} />
            </section>
          ))}
        </div>
      )}

      {summary.all.length > 0 && (
        <Accordion className="rounded-xl border px-4">
          {summary.all.map((group) => (
            <AccordionItem key={group.id} value={group.id}>
              <AccordionTrigger>
                All {group.title} tags ({group.rows.length})
              </AccordionTrigger>
              <AccordionContent>
                <MetadataTable group={group} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
