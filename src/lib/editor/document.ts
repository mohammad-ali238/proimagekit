/**
 * The editor's document model: plain, serialisable data plus pure operations
 * on it. The zustand store (with undo history) wraps these; Konva only renders.
 */

export interface Filters {
  /** -1 … 1 */
  brightness: number;
  /** -100 … 100 */
  contrast: number;
  /** -2 … 2 (HSL saturation) */
  saturation: number;
  /** blur radius in pixels, 0 … 40 */
  blur: number;
  grayscale: boolean;
}

export const defaultFilters: Filters = { brightness: 0, contrast: 0, saturation: 0, blur: 0, grayscale: false };

export function hasFilters(filters: Filters): boolean {
  return (
    filters.brightness !== 0 || filters.contrast !== 0 || filters.saturation !== 0 || filters.blur !== 0 || filters.grayscale
  );
}

interface BaseElement {
  id: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  /** 0 … 1 */
  opacity: number;
  visible: boolean;
  locked: boolean;
}

export interface ImageElement extends BaseElement {
  type: "image";
  /** Object URL of the decoded image. */
  src: string;
  width: number;
  height: number;
  filters: Filters;
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: "normal" | "bold" | "italic" | "bold italic";
  fill: string;
  align: "left" | "center" | "right";
  stroke: string;
  strokeWidth: number;
}

export interface RectElement extends BaseElement {
  type: "rect";
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
}

export interface EllipseElement extends BaseElement {
  type: "ellipse";
  radiusX: number;
  radiusY: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface ArrowElement extends BaseElement {
  type: "arrow";
  /** Points relative to x/y: [x1, y1, x2, y2]. */
  points: [number, number, number, number];
  stroke: string;
  strokeWidth: number;
  /** false draws a plain line. */
  pointer: boolean;
}

export type EditorElement = ImageElement | TextElement | RectElement | EllipseElement | ArrowElement;
export type ElementType = EditorElement["type"];

export interface EditorDocument {
  width: number;
  height: number;
  /** null = transparent */
  background: string | null;
  /** Bottom to top. */
  elements: EditorElement[];
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const fontFamilies = ["Arial", "Helvetica", "Georgia", "Times New Roman", "Courier New", "Verdana", "Impact", "system-ui"];

let counter = 0;
export function newId(): string {
  counter += 1;
  return `el-${Date.now().toString(36)}-${counter}`;
}

const base = (name: string, x: number, y: number): BaseElement => ({
  id: newId(),
  name,
  x,
  y,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  opacity: 1,
  visible: true,
  locked: false,
});

export function createImageElement(src: string, width: number, height: number, name = "Image", x = 0, y = 0): ImageElement {
  return { ...base(name, x, y), type: "image", src, width, height, filters: { ...defaultFilters } };
}

/** Creates a new element sized relative to the document and centred in it. */
export function createElement(type: Exclude<ElementType, "image">, doc: Pick<EditorDocument, "width" | "height">): EditorElement {
  const unit = Math.max(8, Math.round(Math.min(doc.width, doc.height) / 10));
  const cx = doc.width / 2;
  const cy = doc.height / 2;

  switch (type) {
    case "text": {
      const text = "Double-click to edit";
      const fontSize = Math.max(12, Math.round(unit * 0.6));
      // Rough width estimate so the new text starts centred.
      const estimatedWidth = fontSize * text.length * 0.55;
      return {
        ...base("Text", Math.max(0, cx - estimatedWidth / 2), cy - fontSize / 2),
        type: "text",
        text,
        fontSize,
        fontFamily: "Arial",
        fontStyle: "bold",
        fill: "#ffffff",
        align: "left",
        stroke: "#000000",
        strokeWidth: 0,
      };
    }
    case "rect":
      return {
        ...base("Rectangle", cx - unit * 2, cy - unit),
        type: "rect",
        width: unit * 4,
        height: unit * 2,
        fill: "transparent",
        stroke: "#ef4444",
        strokeWidth: Math.max(2, Math.round(unit / 10)),
        cornerRadius: 0,
      };
    case "ellipse":
      return {
        ...base("Ellipse", cx, cy),
        type: "ellipse",
        radiusX: unit * 2,
        radiusY: unit * 1.2,
        fill: "transparent",
        stroke: "#ef4444",
        strokeWidth: Math.max(2, Math.round(unit / 10)),
      };
    case "arrow":
      return {
        ...base("Arrow", cx - unit * 2, cy),
        type: "arrow",
        points: [0, 0, unit * 4, 0],
        stroke: "#ef4444",
        strokeWidth: Math.max(3, Math.round(unit / 8)),
        pointer: true,
      };
  }
}

/** A semi-transparent copyright text in the bottom-right corner. */
export function createWatermark(doc: Pick<EditorDocument, "width" | "height">, text = "© Your Name"): TextElement {
  const fontSize = Math.max(12, Math.round(doc.width / 25));
  const estimatedWidth = fontSize * text.length * 0.55;
  return {
    ...(createElement("text", doc) as TextElement),
    name: "Watermark",
    text,
    fontSize,
    fontStyle: "bold",
    fill: "#ffffff",
    opacity: 0.6,
    x: Math.max(0, doc.width - estimatedWidth - fontSize),
    y: Math.max(0, doc.height - fontSize * 2),
  };
}

export function updateElement(doc: EditorDocument, id: string, patch: Partial<EditorElement>): EditorDocument {
  return {
    ...doc,
    elements: doc.elements.map((element) => (element.id === id ? ({ ...element, ...patch } as EditorElement) : element)),
  };
}

export function removeElement(doc: EditorDocument, id: string): EditorDocument {
  return { ...doc, elements: doc.elements.filter((element) => element.id !== id) };
}

export function duplicateElement(doc: EditorDocument, id: string): { doc: EditorDocument; id: string | null } {
  const index = doc.elements.findIndex((element) => element.id === id);
  if (index === -1) return { doc, id: null };
  const source = doc.elements[index];
  const offset = Math.max(10, Math.round(Math.min(doc.width, doc.height) / 40));
  const copy = { ...source, id: newId(), name: `${source.name} copy`, x: source.x + offset, y: source.y + offset, locked: false };
  const elements = [...doc.elements];
  elements.splice(index + 1, 0, copy);
  return { doc: { ...doc, elements }, id: copy.id };
}

/** Moves an element one step up (towards the front) or down (towards the back). */
export function moveElement(doc: EditorDocument, id: string, direction: "up" | "down"): EditorDocument {
  const index = doc.elements.findIndex((element) => element.id === id);
  const target = direction === "up" ? index + 1 : index - 1;
  if (index === -1 || target < 0 || target >= doc.elements.length) return doc;
  const elements = [...doc.elements];
  [elements[index], elements[target]] = [elements[target], elements[index]];
  return { ...doc, elements };
}

/** Clamps a crop rectangle to the document and rounds it to whole pixels. */
export function normalizeCrop(rect: Rect, doc: Pick<EditorDocument, "width" | "height">): Rect {
  const x = Math.max(0, Math.min(doc.width - 1, Math.round(rect.x)));
  const y = Math.max(0, Math.min(doc.height - 1, Math.round(rect.y)));
  return {
    x,
    y,
    width: Math.max(1, Math.min(doc.width - x, Math.round(rect.width))),
    height: Math.max(1, Math.min(doc.height - y, Math.round(rect.height))),
  };
}

/** Crops the canvas: the document takes the crop's size and every element shifts with it. */
export function applyCrop(doc: EditorDocument, crop: Rect): EditorDocument {
  const rect = normalizeCrop(crop, doc);
  return {
    ...doc,
    width: rect.width,
    height: rect.height,
    elements: doc.elements.map((element) => ({ ...element, x: element.x - rect.x, y: element.y - rect.y })),
  };
}

/** Largest centred rectangle with the given aspect ratio (or the whole document when null). */
export function centredCropRect(doc: Pick<EditorDocument, "width" | "height">, aspect: number | null): Rect {
  if (!aspect) return { x: 0, y: 0, width: doc.width, height: doc.height };
  const width = Math.min(doc.width, doc.height * aspect);
  const height = width / aspect;
  return { x: (doc.width - width) / 2, y: (doc.height - height) / 2, width, height };
}

export function describeElement(element: EditorElement): string {
  if (element.type === "text") return element.text.trim().slice(0, 30) || element.name;
  return element.name;
}

/**
 * Wraps a history recorder so a burst of rapid changes (dragging a slider,
 * typing) becomes a single undo step: only the state before the first change
 * of the burst is recorded. Discrete actions (add, delete, crop…) always get
 * their own step and end any burst.
 */
export function groupBursts<Args extends unknown[]>(
  record: (...args: Args) => void,
  windowMs: number,
  { now = Date.now, isDiscrete = () => false }: { now?: () => number; isDiscrete?: () => boolean } = {},
) {
  let last = -Infinity;
  return (...args: Args) => {
    const time = now();
    const discrete = isDiscrete();
    if (discrete || time - last > windowMs) record(...args);
    last = discrete ? -Infinity : time;
  };
}
