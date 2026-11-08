# ProImageKit — Privacy-First Online Image Tools

**Live website:** [https://www.proimagekit.com/](https://www.proimagekit.com/)

ProImageKit is a browser-based image toolkit for converting, compressing, resizing, editing, and inspecting images. It is built around a simple principle: **your image files stay on your device**. Image processing runs locally in the browser rather than sending selected files to an application server.

The project brings focused image utilities and a full-featured canvas editor together in one responsive web application. It supports batch workflows, format-specific controls, previews, and downloads — without requiring users to upload their photos.

## Key Features

- **Privacy-first processing:** image operations run locally in the browser; selected image files are not uploaded to the ProImageKit server.
- **Batch workflows:** process multiple images, review results, download individual files, or download a ZIP archive.
- **Image conversion:** convert between JPG, PNG, WebP, and AVIF, with dedicated HEIC-to-JPG and other format-specific tools.
- **Compression:** adjust quality and optional maximum dimensions, then compare the original and optimized image.
- **Resizing:** resize by pixels or percentage, preserve aspect ratio, and use social-media presets.
- **Editing tools:** crop, rotate, flip, add text or logo watermarks, and make common image adjustments.
- **Image inspection:** pick colours, inspect image metadata, and remove EXIF/GPS information.
- **Full image editor:** work with images, text, shapes, arrows, layers, filters, crop controls, undo/redo, and keyboard shortcuts.
- **Responsive interface:** light and dark themes, with layouts designed for desktop and mobile.
- **Installable and offline-capable:** a PWA service worker precaches the app and static assets; larger codecs are cached when first used.
- **SEO-ready pages:** statically generated tool pages, sitemap, robots file, structured data, and per-tool Open Graph images.

## Screenshots

Screenshots below show selected tools and pages from the live product. Keep these files in the repository so GitHub can render the images in this README.

### Homepage

![ProImageKit homepage](https://workeera.com/git/proimagekit/screenshots/homepage.png)

### Image Resizer

Resize by exact pixel dimensions or percentage, preserve the aspect ratio, and choose from social-media presets.

![Image Resizer](https://workeera.com/git/proimagekit/screenshots/image-resizer.png)

### Image Compressor

Compress images with a quality control, optional maximum dimensions, output-format selection, and before/after comparison.

![Image Compressor](https://workeera.com/git/proimagekit/screenshots/image-compressor.png)

### Image Converter

Convert between supported formats, including HEIC to JPG, WebP to PNG/JPG, PNG to JPG, JPG to PNG, and a general format converter.

![Image Converter](https://workeera.com/git/proimagekit/screenshots/image-converter.png)

### Add Watermark

Add a text or logo watermark with controls for position, opacity, size, rotation, margin, and tiled placement.

![Add Watermark](https://workeera.com/git/proimagekit/screenshots/watermark-to-image.png)

### Remove EXIF & GPS Data

Remove hidden photo metadata, including GPS and camera information, before sharing an image.

![EXIF Remover](https://workeera.com/git/proimagekit/screenshots/exif-remover.png)

## Tools

The app groups its image utilities into the following categories.

| Category | Tools |
|---|---|
| Convert | HEIC to JPG, WebP to PNG, WebP to JPG, PNG to JPG, JPG to PNG, image format converter |
| Optimize | Image compressor, image resizer |
| Edit | Image cropper, rotate & flip, watermark adder |
| Inspect | Image colour picker, image metadata viewer, EXIF remover |
| Create | Full image editor at `/editor` |

The tool registry is the single source of truth for tool slugs, titles, descriptions, keywords, categories, FAQs, related tools, and converter configuration.

## Image Editor

The editor is available at [`/editor`](https://www.proimagekit.com/editor). It includes:

- A canvas with zoom and pan controls
- Image, text, rectangle, ellipse, and arrow/line elements
- Selection, transform, arrange, duplicate, and layer controls
- Crop tools and aspect-ratio presets
- Brightness, contrast, saturation, blur, and grayscale filters
- Undo and redo history
- Keyboard shortcuts
- Full-resolution export to PNG, JPG, WebP, or AVIF

## How It Works

1. Choose an image tool or open the editor.
2. Select files from your device, or drag and drop them into the page.
3. Adjust the settings for the operation.
4. The browser processes the image locally. More demanding codec operations run in a Web Worker using WebAssembly.
5. Preview the result and download an individual file or a ZIP of the batch.

## Privacy & Security

ProImageKit is designed so selected image files are processed on the user's device and are not uploaded to an application server. Native browser APIs handle common image operations, while WebAssembly codecs run in a Web Worker for supported compression and encoding tasks.

The application also includes a restrictive Content Security Policy and other security headers. Re-encoded image outputs have metadata removed; the dedicated EXIF remover also supports metadata stripping for supported formats.

This describes the image-processing design. For details about analytics, cookies, and other website data, refer to the site's privacy information.

- **Privacy page:** [https://www.proimagekit.com/privacy](https://www.proimagekit.com/privacy)

## Technology Stack

| Area | Technology |
|---|---|
| Framework | Next.js 16, React 19, TypeScript |
| Styling & UI | Tailwind CSS v4, shadcn/ui, Base UI |
| Theme | next-themes |
| Image editor | Konva 10, react-konva |
| Image processing | Canvas APIs, ImageBitmap, WebAssembly codecs |
| Codec worker | jSquash (MozJPEG, OxiPNG, WebP, AVIF) |
| HEIC decoding | heic-to |
| Cropping | react-image-crop |
| Metadata | ExifReader |
| State & history | Zustand, zundo |
| Batch ZIP downloads | fflate |
| Notifications | Sonner |
| PWA | Serwist |
| Testing | Vitest, Playwright |

## Architecture Notes

- The project uses the **Next.js App Router** and pre-renders tool pages at build time.
- Tool definitions live in `src/lib/tools-registry.ts`; individual tool pages share a common tool shell.
- Shared image helpers handle decoding, encoding, conversion, pixel limits, downloads, and ZIP creation.
- Heavy codec work runs in a Web Worker to keep the interface responsive.
- Common conversions use native browser canvas encoding where appropriate; jSquash WebAssembly codecs are used for supported advanced encoding and compression tasks.
- There are no application API routes for image uploads or server-side image processing.
- The app is configured for deployment to Vercel and uses `NEXT_PUBLIC_SITE_URL` for the canonical site URL.

## Run Locally

### Prerequisites

- Node.js 24 (see `.nvmrc`)
- npm

### Setup

```bash
# Clone the repository
git clone <your-repository-url>
cd <repository-directory>

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Quality Checks

The project plan records the following verification commands:

```bash
npm run lint
npx tsc --noEmit
npm run build
npx vitest run
npx playwright test
```

The repository may expose convenience scripts for some of these commands in `package.json`; check the current scripts before running them.

## Deployment

The project is designed to deploy as a standard Next.js application on **Vercel**.

1. Import the repository into Vercel.
2. Configure `NEXT_PUBLIC_SITE_URL` with the production website URL.
3. Build and deploy using the Next.js defaults.

The project does not use static export or a `basePath`. If the application is monetized in the future, review the Vercel plan terms and select a plan that permits the intended commercial use.

## Project Structure

The main source code is organized under `src/`:

```text
src/
├── app/                  # App Router pages, tool routes and metadata routes
├── components/
│   ├── editor/           # Canvas editor, toolbar, panels and state
│   ├── layout/           # Navigation, footer and theme controls
│   ├── pro/              # Upgrade modal / Pro gate
│   ├── tools/            # Shared tool UI and individual tools
│   └── ui/               # Reusable UI components
├── config/               # Site configuration
├── hooks/                # Reusable React hooks
└── lib/
    ├── image/             # Image decoding, encoding and processing
    ├── workers/           # Web Worker codec pipeline
    └── tools-registry.ts  # Tool registry

content/
└── blog/                 # Markdown/MDX articles

public/                    # Static assets and PWA assets
tests/                     # Unit and end-to-end tests
```

This is a high-level overview; consult the repository for the exact current file layout.

## Testing

The project uses:

- **Vitest** for unit tests covering image helpers, format handling, calculations, and application logic.
- **Playwright** for end-to-end browser tests covering tool workflows, output files, editor interactions, and page behaviour.

The project phase log records 74 unit tests and 87 Playwright tests after the launch-polish phase, with additional blog tests added afterward. Run the current test suite in the repository to confirm the latest totals.

## Current Product Status

The project plan records the converter, optimize, edit/inspect, full editor, launch-polish, PWA, SEO, privacy, and blog phases as completed. The Pro upgrade modal and gating hook are present as a placeholder; payment processing is not implemented and the product is free for now.

## Author & Contact

**Ali Malik**

-   **Live project:** [proimagekit.com](https://www.proimagekit.com/)
-   **Portfolio / company:** [workeera.com](https://workeera.com/)
-   **LinkedIn:**
    [linkedin.com/in/ali-malik-a8677067](https://www.linkedin.com/in/ali-malik-a8677067)
-   **Email:** <hello@workeera.com> · <malik.mohamad.ali@gmail.com>

------------------------------------------------------------------------

## License

This repository includes an MIT `LICENSE` file. The project description
supplied for this README also states that the project is intended for
portfolio demonstration purposes and that all rights are reserved.
**Please confirm the intended licensing terms before publishing:** the
MIT license and an "all rights reserved" notice communicate different
permissions. This README does not change the repository's existing
`LICENSE` file.
