import type { LucideIcon } from "lucide-react";
import {
  Crop,
  FileImage,
  FileSearch,
  ImageDown,
  Maximize2,
  Pipette,
  Repeat,
  RotateCw,
  ShieldOff,
  Stamp,
  Wand2,
} from "lucide-react";

/**
 * Single source of truth for every tool on the site. Pages, navigation,
 * sitemap, metadata and FAQ structured data are all generated from here.
 * A tool must be registered before its component is built.
 */

export type ToolCategory = "convert" | "optimize" | "edit" | "inspect";
export type ToolStatus = "ready" | "coming-soon";
export type ImageFormat = "jpeg" | "png" | "webp" | "avif" | "heic" | "gif" | "bmp";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ConverterConfig {
  /** Formats the dropzone accepts; "any" accepts every decodable image. */
  from: ImageFormat[] | "any";
  /** Fixed output format, or "choose" to let the user pick. */
  to: ImageFormat | "choose";
}

export interface ToolDefinition {
  slug: string;
  title: string;
  /** Short label for cards and menus. */
  name: string;
  description: string;
  keywords: string[];
  category: ToolCategory;
  icon: LucideIcon;
  status: ToolStatus;
  faq: FaqItem[];
  /** Slugs of related tools, shown at the bottom of the tool page. */
  related: string[];
  converter?: ConverterConfig;
  /** Facts for the /compare page. */
  batch: boolean;
  output: string;
  highlights: string[];
  /** Set when the tool lives outside /tools/[slug] (e.g. the editor). */
  href?: string;
}

export const categories: Record<ToolCategory, { label: string; description: string }> = {
  convert: { label: "Convert", description: "Change image formats without losing quality." },
  optimize: { label: "Optimize", description: "Make images smaller and the right size." },
  edit: { label: "Edit", description: "Crop, rotate, watermark and edit images." },
  inspect: { label: "Inspect", description: "Look inside images and protect your privacy." },
};

export const categoryOrder: ToolCategory[] = ["convert", "optimize", "edit", "inspect"];

const privacyFaq: FaqItem = {
  question: "Are my images uploaded to a server?",
  answer:
    "No. The whole tool runs inside your browser, so your images never leave your device. The site's security policy also blocks the page from sending files anywhere.",
};

export const tools: ToolDefinition[] = [
  // Convert
  {
    slug: "heic-to-jpg",
    title: "HEIC to JPG Converter",
    name: "HEIC to JPG",
    description: "Convert iPhone HEIC photos to JPG so they open on any device, right in your browser.",
    keywords: ["heic to jpg", "heic converter", "iphone photo to jpg", "heif to jpeg"],
    category: "convert",
    icon: Repeat,
    batch: true,
    output: "JPG",
    highlights: ["Opens every iPhone photo", "Adjustable quality", "Removes location data"],
    status: "ready",
    converter: { from: ["heic"], to: "jpeg" },
    related: ["image-format-converter", "image-compressor", "exif-remover"],
    faq: [
      {
        question: "What is a HEIC file?",
        answer:
          "HEIC is the photo format iPhones use by default. It is smaller than JPG, but many Windows apps, websites and older devices can't open it.",
      },
      privacyFaq,
      {
        question: "Will I lose quality converting HEIC to JPG?",
        answer:
          "JPG is a lossy format, but at the default quality the difference is not visible. You can raise the quality setting if you need a larger, more detailed file.",
      },
      {
        question: "Can I convert several HEIC photos at once?",
        answer: "Yes. Drop multiple files and download them one by one or all together as a ZIP.",
      },
      {
        question: "Is the location data from my iPhone kept?",
        answer:
          "No. Converting re-encodes the image, which removes EXIF metadata such as GPS location and camera details.",
      },
    ],
  },
  {
    slug: "webp-to-png",
    title: "WebP to PNG Converter",
    name: "WebP to PNG",
    description: "Convert WebP images to lossless PNG and keep their transparency.",
    keywords: ["webp to png", "convert webp", "webp converter", "webp transparent png"],
    category: "convert",
    icon: Repeat,
    batch: true,
    output: "PNG",
    highlights: ["Keeps transparency", "Lossless output", "ZIP download"],
    status: "ready",
    converter: { from: ["webp"], to: "png" },
    related: ["webp-to-jpg", "image-format-converter", "image-compressor"],
    faq: [
      {
        question: "Does WebP to PNG keep transparency?",
        answer: "Yes. PNG supports transparency, so transparent areas in your WebP stay transparent.",
      },
      privacyFaq,
      {
        question: "Why is the PNG larger than the WebP?",
        answer:
          "PNG is lossless, so it stores every pixel exactly. WebP usually compresses better, which is why the PNG can be several times bigger.",
      },
      {
        question: "Can I convert animated WebP files?",
        answer: "Only the first frame of an animated WebP is converted.",
      },
    ],
  },
  {
    slug: "webp-to-jpg",
    title: "WebP to JPG Converter",
    name: "WebP to JPG",
    description: "Convert WebP images to JPG with adjustable quality and a background colour for transparent areas.",
    keywords: ["webp to jpg", "webp to jpeg", "convert webp to jpg", "webp converter"],
    category: "convert",
    icon: Repeat,
    batch: true,
    output: "JPG",
    highlights: ["Quality slider", "Background colour for transparency", "ZIP download"],
    status: "ready",
    converter: { from: ["webp"], to: "jpeg" },
    related: ["webp-to-png", "image-format-converter", "image-compressor"],
    faq: [
      {
        question: "What happens to transparent areas?",
        answer: "JPG has no transparency, so transparent pixels are filled with a background colour you choose (white by default).",
      },
      privacyFaq,
      {
        question: "Which quality should I choose?",
        answer: "80–90 is a good balance of size and quality for photos. Use higher values for images with fine text or sharp edges.",
      },
      {
        question: "Can I convert many files at once?",
        answer: "Yes. Drop multiple WebP files and download them individually or as a ZIP.",
      },
    ],
  },
  {
    slug: "png-to-jpg",
    title: "PNG to JPG Converter",
    name: "PNG to JPG",
    description: "Convert PNG images to smaller JPG files, with a background colour for transparency.",
    keywords: ["png to jpg", "png to jpeg", "convert png", "reduce png size"],
    category: "convert",
    icon: Repeat,
    batch: true,
    output: "JPG",
    highlights: ["Much smaller photos", "Background colour for transparency", "ZIP download"],
    status: "ready",
    converter: { from: ["png"], to: "jpeg" },
    related: ["jpg-to-png", "image-compressor", "image-format-converter"],
    faq: [
      {
        question: "Why convert PNG to JPG?",
        answer: "JPG files are usually much smaller for photos, which makes them faster to share, email and upload.",
      },
      privacyFaq,
      {
        question: "What happens to transparent backgrounds?",
        answer: "They are filled with the background colour you pick, since JPG can't store transparency.",
      },
      {
        question: "Should I use PNG to JPG for logos and screenshots?",
        answer: "Usually not. Logos and screenshots with sharp edges look best as PNG or WebP. JPG is best for photos.",
      },
    ],
  },
  {
    slug: "jpg-to-png",
    title: "JPG to PNG Converter",
    name: "JPG to PNG",
    description: "Convert JPG images to lossless PNG files in your browser.",
    keywords: ["jpg to png", "jpeg to png", "convert jpg", "jpg converter"],
    category: "convert",
    icon: Repeat,
    batch: true,
    output: "PNG",
    highlights: ["Lossless from now on", "Applies camera rotation", "ZIP download"],
    status: "ready",
    converter: { from: ["jpeg"], to: "png" },
    related: ["png-to-jpg", "image-format-converter", "image-cropper"],
    faq: [
      {
        question: "Does converting JPG to PNG improve quality?",
        answer: "No. PNG stores the image losslessly from now on, but it can't restore detail the JPG already lost.",
      },
      privacyFaq,
      {
        question: "Will the PNG have a transparent background?",
        answer: "No. JPG has no transparency, so the PNG keeps the same solid background.",
      },
      {
        question: "Why is the PNG so much bigger?",
        answer: "PNG uses lossless compression, which is less efficient than JPG for photos.",
      },
    ],
  },
  {
    slug: "image-format-converter",
    title: "Image Format Converter",
    name: "Format Converter",
    description: "Convert any image to JPG, PNG, WebP or AVIF — in bulk and entirely in your browser.",
    keywords: ["image converter", "convert image format", "image to webp", "image to avif", "online image converter"],
    category: "convert",
    icon: FileImage,
    batch: true,
    output: "JPG, PNG, WebP, AVIF",
    highlights: ["Reads HEIC, AVIF, GIF, BMP", "AVIF encoding", "ZIP download"],
    status: "ready",
    converter: { from: "any", to: "choose" },
    related: ["image-compressor", "heic-to-jpg", "image-resizer"],
    faq: [
      {
        question: "Which formats can I convert from?",
        answer: "JPG, PNG, WebP, AVIF, GIF (first frame), BMP and HEIC.",
      },
      {
        question: "Which formats can I convert to?",
        answer: "JPG, PNG, WebP and AVIF.",
      },
      privacyFaq,
      {
        question: "Which format should I use for the web?",
        answer: "WebP is supported everywhere and is much smaller than JPG or PNG. AVIF is even smaller but slower to encode.",
      },
      {
        question: "Why does AVIF take longer?",
        answer: "AVIF uses a very efficient but compute-heavy encoder. It runs in the background so the page stays responsive.",
      },
    ],
  },

  // Optimize
  {
    slug: "image-compressor",
    title: "Image Compressor",
    name: "Compressor",
    description: "Shrink JPG, PNG, WebP and AVIF files with a quality slider and a before/after comparison.",
    keywords: ["compress image", "image compressor", "reduce image size", "compress jpg", "compress png"],
    category: "optimize",
    icon: ImageDown,
    batch: true,
    output: "Same format, JPG, PNG, WebP or AVIF",
    highlights: ["MozJPEG, OxiPNG, WebP, AVIF", "Before/after slider", "Optional max size"],
    status: "ready",
    related: ["image-resizer", "image-format-converter", "exif-remover"],
    faq: [
      {
        question: "How much smaller will my image get?",
        answer: "Photos usually shrink by 50–80% with no visible change. The exact saving is shown for every file.",
      },
      privacyFaq,
      {
        question: "What is the difference between lossy and lossless compression?",
        answer: "Lossy compression removes detail you are unlikely to notice. Lossless compression (used for PNG) keeps every pixel but saves less space.",
      },
      {
        question: "Can I also resize while compressing?",
        answer: "Yes. Set a maximum width or height and larger images are scaled down before compressing.",
      },
    ],
  },
  {
    slug: "image-resizer",
    title: "Image Resizer",
    name: "Resizer",
    description: "Resize images by pixels or percentage, with presets for Instagram, X, Facebook, YouTube and LinkedIn.",
    keywords: ["resize image", "image resizer", "change image size", "instagram image size"],
    category: "optimize",
    icon: Maximize2,
    batch: true,
    output: "Same format, JPG, PNG, WebP or AVIF",
    highlights: ["Social media presets", "Crop, fit or stretch", "Sharp Lanczos scaling"],
    status: "ready",
    related: ["image-cropper", "image-compressor", "image-format-converter"],
    faq: [
      {
        question: "Will resizing stretch my image?",
        answer: "Not while the aspect-ratio lock is on. Turn it off only if you want to change the proportions.",
      },
      privacyFaq,
      {
        question: "Can I make an image bigger?",
        answer: "Yes, but enlarging can't add detail, so the result may look soft.",
      },
      {
        question: "What sizes do the social media presets use?",
        answer: "Each preset uses the platform's recommended size, such as 1080×1080 for an Instagram post.",
      },
    ],
  },

  // Edit
  {
    slug: "image-cropper",
    title: "Image Cropper",
    name: "Cropper",
    description: "Crop images freely or to 1:1, 4:3, 16:9, 9:16 and more, with exact pixel sizes and touch support.",
    keywords: ["crop image", "image cropper", "crop photo online", "square crop"],
    category: "edit",
    icon: Crop,
    batch: false,
    output: "Same format, JPG, PNG, WebP or AVIF",
    highlights: ["Free or fixed ratios", "Exact pixel size", "Opens HEIC"],
    status: "ready",
    related: ["image-resizer", "image-rotator", "image-editor"],
    faq: [
      {
        question: "Can I crop to an exact aspect ratio?",
        answer: "Yes. Choose 1:1, 4:3, 3:2, 16:9, 4:5, 9:16 or the original ratio, or use free crop.",
      },
      privacyFaq,
      {
        question: "Does cropping reduce quality?",
        answer: "No. The cropped area keeps its original pixels.",
      },
    ],
  },
  {
    slug: "image-rotator",
    title: "Rotate & Flip Image",
    name: "Rotate & Flip",
    description: "Rotate images by 90°, 180° or 270° and flip them horizontally or vertically.",
    keywords: ["rotate image", "flip image", "mirror image", "rotate photo"],
    category: "edit",
    icon: RotateCw,
    batch: true,
    output: "Same format, JPG, PNG, WebP or AVIF",
    highlights: ["90°, 180°, 270°", "Flip horizontal or vertical", "Live preview"],
    status: "ready",
    related: ["image-cropper", "image-resizer", "image-editor"],
    faq: [
      {
        question: "Why does my photo appear sideways?",
        answer: "Some cameras store rotation as metadata instead of rotating the pixels. This tool applies the rotation permanently.",
      },
      privacyFaq,
      {
        question: "Can I rotate several images at once?",
        answer: "Yes. The same rotation and flip are applied to every file you add.",
      },
    ],
  },
  {
    slug: "watermark-adder",
    title: "Add Watermark to Image",
    name: "Watermark",
    description: "Add a text or logo watermark with position, opacity, size, rotation and tiling controls.",
    keywords: ["watermark image", "add watermark", "logo watermark", "text watermark"],
    category: "edit",
    icon: Stamp,
    batch: true,
    output: "Same format, JPG, PNG, WebP or AVIF",
    highlights: ["Text or logo", "9 positions or tiled", "Opacity and rotation"],
    status: "ready",
    related: ["image-editor", "image-resizer", "image-compressor"],
    faq: [
      {
        question: "Can I use my logo as a watermark?",
        answer: "Yes. Upload a PNG with a transparent background for the cleanest result.",
      },
      privacyFaq,
      {
        question: "Can I watermark many images at once?",
        answer: "Yes. The same watermark settings are applied to every image you add.",
      },
    ],
  },
  {
    slug: "image-editor",
    title: "Image Editor",
    name: "Image Editor",
    description: "A full editor with text, shapes, arrows, crop, filters, layers and undo — all in your browser.",
    keywords: ["online image editor", "photo editor", "add text to image", "annotate image"],
    category: "edit",
    icon: Wand2,
    batch: false,
    output: "PNG, JPG, WebP, AVIF",
    highlights: ["Text, shapes, arrows", "Filters and crop", "Layers and undo"],
    status: "ready",
    href: "/editor",
    related: ["image-cropper", "watermark-adder", "image-rotator"],
    faq: [
      {
        question: "What can I do in the image editor?",
        answer: "Add text, rectangles, ellipses, arrows, watermarks and other images; crop the canvas; adjust brightness, contrast, saturation, blur and black & white; and rearrange, lock or hide layers.",
      },
      privacyFaq,
      {
        question: "Does exporting reduce the resolution?",
        answer: "No. Your image is exported at its full original size, whatever zoom level you're working at.",
      },
      {
        question: "Can I undo changes?",
        answer: "Yes. Use the undo and redo buttons or Ctrl/⌘+Z and Ctrl/⌘+Shift+Z. Up to 100 steps are kept.",
      },
      {
        question: "Which formats can I export?",
        answer: "PNG (lossless, keeps transparency), JPG (works everywhere), WebP (small) and AVIF (smallest).",
      },
    ],
  },

  // Inspect
  {
    slug: "image-color-picker",
    title: "Image Color Picker",
    name: "Color Picker",
    description: "Pick any colour from an image and copy it as HEX, RGB or HSL, plus see its main colour palette.",
    keywords: ["color picker from image", "image color picker", "hex from image", "eyedropper"],
    category: "inspect",
    icon: Pipette,
    batch: false,
    output: "HEX, RGB and HSL values",
    highlights: ["Pick any pixel", "Main colour palette", "Screen eyedropper"],
    status: "ready",
    related: ["image-metadata-viewer", "image-editor", "image-format-converter"],
    faq: [
      {
        question: "How do I pick a colour?",
        answer: "Click anywhere on the image. The colour appears as HEX, RGB and HSL values you can copy.",
      },
      privacyFaq,
      {
        question: "Can I pick colours outside the image?",
        answer: "In browsers that support the EyeDropper API (such as Chrome and Edge), you can pick any colour on your screen.",
      },
    ],
  },
  {
    slug: "image-metadata-viewer",
    title: "Image Metadata (EXIF) Viewer",
    name: "Metadata Viewer",
    description: "See the hidden EXIF data inside a photo, including camera, date and GPS location.",
    keywords: ["exif viewer", "image metadata", "photo metadata", "check photo location"],
    category: "inspect",
    icon: FileSearch,
    batch: false,
    output: "Metadata report",
    highlights: ["Shows GPS location", "Camera and author details", "Every raw tag"],
    status: "ready",
    related: ["exif-remover", "image-color-picker", "heic-to-jpg"],
    faq: [
      {
        question: "What is EXIF data?",
        answer: "Information your camera or phone saves inside the photo, such as the device, settings, date and often the GPS location.",
      },
      privacyFaq,
      {
        question: "How do I remove this data?",
        answer: "Use the EXIF Remover tool to save a clean copy without any metadata.",
      },
    ],
  },
  {
    slug: "exif-remover",
    title: "Remove EXIF & GPS Data from Photos",
    name: "EXIF Remover",
    description: "Strip location, camera and other hidden metadata from photos before you share them.",
    keywords: ["remove exif", "remove gps from photo", "strip metadata", "exif remover"],
    category: "inspect",
    icon: ShieldOff,
    batch: true,
    output: "Same file, without metadata",
    highlights: ["Image data untouched", "Keeps colour profiles", "Straightens rotated photos"],
    status: "ready",
    related: ["image-metadata-viewer", "image-compressor", "heic-to-jpg"],
    faq: [
      {
        question: "Why remove EXIF data?",
        answer: "Photos can reveal where you live or where they were taken. Removing metadata before sharing protects your privacy.",
      },
      privacyFaq,
      {
        question: "Does removing metadata change the image?",
        answer: "For JPG files the pixels are not touched — only the metadata is removed. Other formats are re-saved at high quality.",
      },
      {
        question: "Will my photo still be the right way up?",
        answer: "Yes. Any rotation stored in the metadata is applied to the pixels before the metadata is removed.",
      },
    ],
  },
];

export function getTool(slug: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function getToolHref(tool: ToolDefinition): string {
  return tool.href ?? `/tools/${tool.slug}`;
}

/** Tools that are rendered by the dynamic /tools/[slug] route. */
export function getRoutedTools(): ToolDefinition[] {
  return tools.filter((tool) => !tool.href);
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return tools.filter((tool) => tool.category === category);
}

export function getRelatedTools(tool: ToolDefinition): ToolDefinition[] {
  return tool.related
    .map((slug) => getTool(slug))
    .filter((related): related is ToolDefinition => related !== undefined);
}
