"use client";

import { useEffect } from "react";
import { createElement } from "@/lib/editor/document";
import { redo, selectedElement, undo, useEditor } from "./store";

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.getAttribute("role") === "slider";
}

/**
 * Editor keyboard shortcuts. Ignored while typing in a field, except undo/redo
 * outside text boxes.
 *
 * Ctrl/⌘+Z undo · Ctrl/⌘+Shift+Z or Ctrl+Y redo · Delete/Backspace remove ·
 * Ctrl/⌘+D duplicate · arrows nudge (Shift = 10px) · Esc deselect/cancel crop ·
 * Enter apply crop · V select · T text · R rectangle · O ellipse · A arrow ·
 * C crop · +/− zoom · 0 fit
 */
export function useEditorShortcuts({ onFit }: { onFit: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const state = useEditor.getState();
      const { doc, tool } = state;
      if (!doc || isTyping(event.target)) return;
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      const element = selectedElement(state);

      const handled = (() => {
        if (mod && key === "z") {
          if (event.shiftKey) redo();
          else undo();
          return true;
        }
        if (mod && key === "y") {
          redo();
          return true;
        }
        if (mod && key === "d" && element) {
          state.duplicate(element.id);
          return true;
        }
        if (mod) return false;

        if (tool === "crop") {
          if (key === "enter") state.applyCrop();
          else if (key === "escape") state.cancelCrop();
          else return false;
          return true;
        }

        if ((key === "delete" || key === "backspace") && element) {
          state.remove(element.id);
          return true;
        }
        if (key === "escape") {
          state.select(null);
          return true;
        }
        if (key.startsWith("arrow") && element && !element.locked) {
          const step = event.shiftKey ? 10 : 1;
          const dx = key === "arrowleft" ? -step : key === "arrowright" ? step : 0;
          const dy = key === "arrowup" ? -step : key === "arrowdown" ? step : 0;
          state.update(element.id, { x: element.x + dx, y: element.y + dy });
          return true;
        }

        const shapes: Record<string, "text" | "rect" | "ellipse" | "arrow"> = { t: "text", r: "rect", o: "ellipse", a: "arrow" };
        if (shapes[key]) {
          state.add(createElement(shapes[key], doc));
          return true;
        }
        if (key === "v") state.cancelCrop();
        else if (key === "c") state.startCrop();
        else if (key === "+" || key === "=") state.setZoom(state.zoom * 1.25);
        else if (key === "-") state.setZoom(state.zoom / 1.25);
        else if (key === "0") onFit();
        else return false;
        return true;
      })();

      if (handled) event.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onFit]);
}
