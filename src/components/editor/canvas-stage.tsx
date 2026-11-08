"use client";

import { useEffect, useRef, type RefObject } from "react";
import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Arrow, Ellipse, Image as KonvaImage, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
import { hasFilters, type EditorDocument, type EditorElement, type ImageElement } from "@/lib/editor/document";
import { useAssetImage } from "./assets";
import { useEditor } from "./store";

type Patch = Partial<EditorElement>;

interface NodeProps {
  element: EditorElement;
  interactive: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, patch: Patch) => void;
  onTextEdit: (id: string) => void;
}

function commonProps({ element, interactive, onSelect, onChange }: NodeProps) {
  const select = () => interactive && onSelect(element.id);
  return {
    id: element.id,
    x: element.x,
    y: element.y,
    rotation: element.rotation,
    scaleX: element.scaleX,
    scaleY: element.scaleY,
    opacity: element.opacity,
    draggable: interactive && !element.locked,
    listening: interactive,
    onMouseDown: select,
    onTap: select,
    onDragEnd: (event: KonvaEventObject<DragEvent>) => onChange(element.id, { x: event.target.x(), y: event.target.y() }),
    onTransformEnd: (event: KonvaEventObject<Event>) => {
      const node = event.target;
      onChange(element.id, {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
      });
    },
  };
}

function ImageNode(props: NodeProps & { element: ImageElement }) {
  const { element } = props;
  const image = useAssetImage(element.src);
  const ref = useRef<Konva.Image>(null);
  const filtered = hasFilters(element.filters);

  // Konva filters only run on cached nodes; re-cache whenever the pixels or filters change.
  useEffect(() => {
    const node = ref.current;
    if (!node || !image) return;
    if (filtered) node.cache();
    else node.clearCache();
    node.getLayer()?.batchDraw();
  }, [image, filtered, element.filters, element.width, element.height]);

  const { brightness, contrast, saturation, blur, grayscale } = element.filters;
  const filters = filtered
    ? [
        Konva.Filters.Brighten,
        Konva.Filters.Contrast,
        Konva.Filters.HSL,
        ...(blur > 0 ? [Konva.Filters.Blur] : []),
        ...(grayscale ? [Konva.Filters.Grayscale] : []),
      ]
    : [];

  return (
    <KonvaImage
      ref={ref}
      image={image}
      width={element.width}
      height={element.height}
      filters={filters}
      brightness={brightness}
      contrast={contrast}
      saturation={saturation}
      blurRadius={blur}
      {...commonProps(props)}
    />
  );
}

function ElementNode(props: NodeProps) {
  const { element, onTextEdit } = props;
  if (!element.visible) return null;
  const common = commonProps(props);

  switch (element.type) {
    case "image":
      return <ImageNode {...props} element={element} />;
    case "text":
      return (
        <Text
          {...common}
          text={element.text}
          fontSize={element.fontSize}
          fontFamily={element.fontFamily}
          fontStyle={element.fontStyle}
          fill={element.fill}
          align={element.align}
          stroke={element.strokeWidth > 0 ? element.stroke : undefined}
          strokeWidth={element.strokeWidth}
          fillAfterStrokeEnabled
          onDblClick={() => onTextEdit(element.id)}
          onDblTap={() => onTextEdit(element.id)}
        />
      );
    case "rect":
      return (
        <Rect
          {...common}
          width={element.width}
          height={element.height}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          cornerRadius={element.cornerRadius}
        />
      );
    case "ellipse":
      return (
        <Ellipse
          {...common}
          radiusX={element.radiusX}
          radiusY={element.radiusY}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
        />
      );
    case "arrow": {
      const shared = {
        ...common,
        points: element.points,
        stroke: element.stroke,
        strokeWidth: element.strokeWidth,
        lineCap: "round" as const,
        lineJoin: "round" as const,
        hitStrokeWidth: Math.max(20, element.strokeWidth * 3),
      };
      return element.pointer ? (
        <Arrow {...shared} fill={element.stroke} pointerLength={element.strokeWidth * 3} pointerWidth={element.strokeWidth * 3} />
      ) : (
        <Line {...shared} />
      );
    }
  }
}

function CropOverlay({ doc, zoom }: { doc: EditorDocument; zoom: number }) {
  const crop = useEditor((state) => state.crop);
  const setCrop = useEditor((state) => state.setCrop);
  const rectRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (rectRef.current && transformerRef.current) {
      transformerRef.current.nodes([rectRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [crop?.aspect]);

  if (!crop) return null;
  const { rect, aspect } = crop;
  const shade = "rgba(0, 0, 0, 0.55)";

  const readRect = (node: Konva.Node) => {
    const next = { x: node.x(), y: node.y(), width: node.width() * node.scaleX(), height: node.height() * node.scaleY() };
    node.scaleX(1);
    node.scaleY(1);
    return next;
  };

  return (
    <>
      <Rect x={0} y={0} width={doc.width} height={rect.y} fill={shade} listening={false} />
      <Rect x={0} y={rect.y + rect.height} width={doc.width} height={doc.height - rect.y - rect.height} fill={shade} listening={false} />
      <Rect x={0} y={rect.y} width={rect.x} height={rect.height} fill={shade} listening={false} />
      <Rect x={rect.x + rect.width} y={rect.y} width={doc.width - rect.x - rect.width} height={rect.height} fill={shade} listening={false} />
      <Rect
        ref={rectRef}
        name="crop-rect"
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        stroke="#ffffff"
        strokeWidth={1.5}
        strokeScaleEnabled={false}
        dash={[6, 4]}
        draggable
        dragBoundFunc={(position) => ({
          x: Math.max(0, Math.min(position.x, (doc.width - rect.width) * zoom)),
          y: Math.max(0, Math.min(position.y, (doc.height - rect.height) * zoom)),
        })}
        onDragMove={(event) => setCrop(readRect(event.target))}
        onTransformEnd={(event) => setCrop(readRect(event.target))}
      />
      <Transformer
        ref={transformerRef}
        rotateEnabled={false}
        keepRatio={aspect !== null}
        flipEnabled={false}
        enabledAnchors={aspect !== null ? ["top-left", "top-right", "bottom-left", "bottom-right"] : undefined}
        boundBoxFunc={(oldBox, newBox) => {
          const inside =
            newBox.x >= -0.5 &&
            newBox.y >= -0.5 &&
            newBox.x + newBox.width <= doc.width * zoom + 0.5 &&
            newBox.y + newBox.height <= doc.height * zoom + 0.5;
          return inside && newBox.width >= 10 && newBox.height >= 10 ? newBox : oldBox;
        }}
      />
    </>
  );
}

export function CanvasStage({ contentLayerRef }: { contentLayerRef: RefObject<Konva.Layer | null> }) {
  const doc = useEditor((state) => state.doc);
  const zoom = useEditor((state) => state.zoom);
  const tool = useEditor((state) => state.tool);
  const selectedId = useEditor((state) => state.selectedId);
  const select = useEditor((state) => state.select);
  const update = useEditor((state) => state.update);
  const requestTextEdit = useEditor((state) => state.requestTextEdit);
  const transformerRef = useRef<Konva.Transformer>(null);

  const selected = doc?.elements.find((element) => element.id === selectedId);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const node = selected && !selected.locked && selected.visible ? transformer.getStage()?.findOne(`#${selected.id}`) : undefined;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selected, doc]);

  if (!doc) return null;
  const interactive = tool === "select";

  return (
    <Stage
      width={Math.max(1, Math.round(doc.width * zoom))}
      height={Math.max(1, Math.round(doc.height * zoom))}
      scaleX={zoom}
      scaleY={zoom}
      onMouseDown={(event) => {
        if (interactive && (event.target === event.target.getStage() || event.target.name() === "background")) select(null);
      }}
      onTouchStart={(event) => {
        if (interactive && (event.target === event.target.getStage() || event.target.name() === "background")) select(null);
      }}
    >
      <Layer ref={contentLayerRef}>
        {doc.background && <Rect name="background" x={0} y={0} width={doc.width} height={doc.height} fill={doc.background} />}
        {doc.elements.map((element) => (
          <ElementNode
            key={element.id}
            element={element}
            interactive={interactive}
            onSelect={select}
            onChange={update}
            onTextEdit={requestTextEdit}
          />
        ))}
      </Layer>
      <Layer>
        {interactive && (
          <Transformer
            ref={transformerRef}
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
            anchorStyleFunc={(anchor) => {
              anchor.cornerRadius(6);
            }}
            boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5 ? oldBox : newBox)}
          />
        )}
        {tool === "crop" && <CropOverlay doc={doc} zoom={zoom} />}
      </Layer>
    </Stage>
  );
}
