"use client";

import { ArrowUpRight, Circle, Eye, EyeOff, ImageIcon, Lock, LockOpen, Square, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { describeElement, type ElementType } from "@/lib/editor/document";
import { cn } from "@/lib/utils";
import { useEditor } from "./store";

const icons: Record<ElementType, typeof Type> = {
  image: ImageIcon,
  text: Type,
  rect: Square,
  ellipse: Circle,
  arrow: ArrowUpRight,
};

export function LayersPanel() {
  const elements = useEditor((state) => state.doc?.elements ?? null);
  const selectedId = useEditor((state) => state.selectedId);
  const select = useEditor((state) => state.select);
  const update = useEditor((state) => state.update);
  const tool = useEditor((state) => state.tool);

  if (!elements) return null;

  return (
    <section className="rounded-xl border bg-card p-4" aria-labelledby="layers-heading">
      <h2 id="layers-heading" className="mb-2 text-sm font-semibold">
        Layers
      </h2>
      {elements.length === 0 ? (
        <p className="text-sm text-muted-foreground">No layers yet.</p>
      ) : (
        <ul className="space-y-1" aria-label="Layers, front to back">
          {[...elements].reverse().map((element) => {
            const Icon = icons[element.type];
            const selected = element.id === selectedId;
            return (
              <li
                key={element.id}
                className={cn(
                  "flex items-center gap-1 rounded-lg border border-transparent pr-1",
                  selected ? "border-primary/40 bg-primary/10" : "hover:bg-muted",
                  !element.visible && "opacity-60",
                )}
              >
                <button
                  type="button"
                  aria-current={selected}
                  disabled={tool === "crop"}
                  onClick={() => select(element.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate">{describeElement(element)}</span>
                </button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={element.visible ? `Hide ${describeElement(element)}` : `Show ${describeElement(element)}`}
                  onClick={() => update(element.id, { visible: !element.visible })}
                >
                  {element.visible ? <Eye /> : <EyeOff />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={element.locked ? `Unlock ${describeElement(element)}` : `Lock ${describeElement(element)}`}
                  onClick={() => update(element.id, { locked: !element.locked })}
                >
                  {element.locked ? <Lock /> : <LockOpen className="opacity-40" />}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
