"use client";

import { temporal } from "zundo";
import { create } from "zustand";
import {
  applyCrop,
  centredCropRect,
  duplicateElement,
  groupBursts,
  moveElement,
  normalizeCrop,
  removeElement,
  updateElement,
  type EditorDocument,
  type EditorElement,
  type Rect,
} from "@/lib/editor/document";

export type EditorTool = "select" | "crop";

interface EditorState {
  doc: EditorDocument | null;
  fileName: string;
  selectedId: string | null;
  tool: EditorTool;
  crop: { rect: Rect; aspect: number | null } | null;
  zoom: number;
  /** Incremented to ask the properties panel to focus the text box (double-click on text). */
  textEditRequest: number;

  open: (doc: EditorDocument, fileName: string) => void;
  close: () => void;
  select: (id: string | null) => void;
  add: (element: EditorElement) => void;
  update: (id: string, patch: Partial<EditorElement>) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  move: (id: string, direction: "up" | "down") => void;
  setBackground: (background: string | null) => void;
  startCrop: () => void;
  setCrop: (rect: Rect, aspect?: number | null) => void;
  applyCrop: () => void;
  cancelCrop: () => void;
  setZoom: (zoom: number) => void;
  requestTextEdit: (id: string) => void;
}

/**
 * True while a discrete action (add, delete, duplicate, reorder, crop…) runs,
 * so it always becomes its own undo step. Continuous edits (property sliders,
 * typing) are grouped into one step per burst.
 */
let discreteAction = false;

export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 4;

export const useEditor = create<EditorState>()(
  temporal(
    (set, get) => {
      const edit = (change: (doc: EditorDocument) => EditorDocument) => {
        const { doc } = get();
        if (doc) set({ doc: change(doc) });
      };
      const discrete = (action: () => void) => {
        discreteAction = true;
        try {
          action();
        } finally {
          discreteAction = false;
        }
      };

      return {
        doc: null,
        fileName: "image",
        selectedId: null,
        tool: "select",
        crop: null,
        zoom: 1,
        textEditRequest: 0,

        open: (doc, fileName) => set({ doc, fileName, selectedId: null, tool: "select", crop: null }),
        close: () => set({ doc: null, selectedId: null, tool: "select", crop: null }),
        select: (selectedId) => set({ selectedId }),
        add: (element) =>
          discrete(() => {
            edit((doc) => ({ ...doc, elements: [...doc.elements, element] }));
            set({ selectedId: element.id, tool: "select", crop: null });
          }),
        update: (id, patch) => edit((doc) => updateElement(doc, id, patch)),
        remove: (id) =>
          discrete(() => {
            edit((doc) => removeElement(doc, id));
            if (get().selectedId === id) set({ selectedId: null });
          }),
        duplicate: (id) =>
          discrete(() => {
            const { doc } = get();
            if (!doc) return;
            const result = duplicateElement(doc, id);
            set({ doc: result.doc, selectedId: result.id });
          }),
        move: (id, direction) => discrete(() => edit((doc) => moveElement(doc, id, direction))),
        setBackground: (background) => edit((doc) => ({ ...doc, background })),
        startCrop: () => {
          const { doc } = get();
          if (doc) set({ tool: "crop", selectedId: null, crop: { rect: centredCropRect(doc, null), aspect: null } });
        },
        setCrop: (rect, aspect) => {
          const { doc, crop } = get();
          if (!doc) return;
          set({ crop: { rect: normalizeCrop(rect, doc), aspect: aspect === undefined ? (crop?.aspect ?? null) : aspect } });
        },
        applyCrop: () =>
          discrete(() => {
            const { crop } = get();
            if (crop) edit((doc) => applyCrop(doc, crop.rect));
            set({ tool: "select", crop: null });
          }),
        cancelCrop: () => set({ tool: "select", crop: null }),
        setZoom: (zoom) => set({ zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom)) }),
        requestTextEdit: (id) => set((state) => ({ selectedId: id, textEditRequest: state.textEditRequest + 1 })),
      };
    },
    {
      // Only the document is part of undo history — not selection, tool or zoom.
      partialize: (state) => ({ doc: state.doc }),
      equality: (past, current) => past.doc === current.doc,
      limit: 100,
      // zundo only calls this for document changes (see `equality`), so selection
      // and zoom changes never extend a burst. It's typed as setState but is
      // called with (past, replace, current, delta), all of which must be passed on.
      handleSet: (handleSet) =>
        groupBursts(handleSet as unknown as (...args: unknown[]) => void, 400, {
          isDiscrete: () => discreteAction,
        }) as typeof handleSet,
    },
  ),
);

/** Opens a document with a fresh undo history. */
export function openDocument(doc: EditorDocument, fileName: string) {
  useEditor.getState().open(doc, fileName);
  useEditor.temporal.getState().clear();
}

export function closeDocument() {
  useEditor.getState().close();
  useEditor.temporal.getState().clear();
}

export function undo() {
  useEditor.temporal.getState().undo();
  dropStaleSelection();
}

export function redo() {
  useEditor.temporal.getState().redo();
  dropStaleSelection();
}

/** After undo/redo the selected element may no longer exist. */
function dropStaleSelection() {
  const { doc, selectedId } = useEditor.getState();
  if (selectedId && !doc?.elements.some((element) => element.id === selectedId)) useEditor.setState({ selectedId: null });
}

export function selectedElement(state: Pick<EditorState, "doc" | "selectedId">): EditorElement | null {
  return state.doc?.elements.find((element) => element.id === state.selectedId) ?? null;
}
