/// <reference lib="webworker" />
import type { AVIFModule } from "@jsquash/avif/codec/enc/avif_enc";
import type { CodecRequest, CodecResponse, EncodeRequest, ResizeRequest } from "./codec-protocol";

/**
 * Runs the WebAssembly codecs off the main thread so the page stays
 * responsive. Each codec is imported only the first time it's needed.
 *
 * AVIF and OxiPNG are loaded from their single-threaded builds directly: the
 * packages' entry points also reference multi-threaded builds whose workers
 * import themselves in a cycle that hangs Turbopack. Threads need
 * cross-origin isolation anyway, which this site doesn't enable.
 */

declare const self: DedicatedWorkerGlobalScope;

let avifModule: Promise<AVIFModule> | null = null;
let oxipngReady: Promise<typeof import("@jsquash/oxipng/codec/pkg/squoosh_oxipng.js")> | null = null;

function loadAvif(): Promise<AVIFModule> {
  avifModule ??= import("@jsquash/avif/codec/enc/avif_enc.js").then(({ default: factory }) =>
    factory({ noInitialRun: true }),
  );
  return avifModule;
}

function loadOxipng() {
  oxipngReady ??= import("@jsquash/oxipng/codec/pkg/squoosh_oxipng.js").then(async (oxipng) => {
    await oxipng.default();
    return oxipng;
  });
  return oxipngReady;
}

async function encode({ format, image, quality }: EncodeRequest): Promise<ArrayBuffer> {
  switch (format) {
    case "jpeg": {
      const { default: encodeJpeg } = await import("@jsquash/jpeg/encode");
      return encodeJpeg(image, { quality });
    }
    case "png": {
      const oxipng = await loadOxipng();
      // Level 2 is oxipng's recommended balance of speed and size.
      return oxipng.optimise_raw(image.data, image.width, image.height, 2, false, true).slice().buffer;
    }
    case "webp": {
      const { default: encodeWebp } = await import("@jsquash/webp/encode");
      return encodeWebp(image, { quality });
    }
    case "avif": {
      const [module, { defaultOptions }] = await Promise.all([loadAvif(), import("@jsquash/avif/meta.js")]);
      // speed 6 is a good balance of encode time and size for interactive use.
      const output = module.encode(new Uint8Array(image.data.buffer), image.width, image.height, {
        ...defaultOptions,
        quality,
        speed: 6,
      });
      if (!output) throw new Error("AVIF encoding failed.");
      return output.slice().buffer;
    }
  }
}

async function resize({ image, width, height }: ResizeRequest): Promise<ImageData> {
  const { default: resizeImage } = await import("@jsquash/resize");
  // Lanczos3 in linear light gives sharper, more accurate results than canvas scaling.
  return resizeImage(image, { width, height, method: "lanczos3", fitMethod: "stretch", premultiply: true, linearRGB: true });
}

self.onmessage = async (event: MessageEvent<CodecRequest>) => {
  const request = event.data;
  try {
    if (request.type === "resize") {
      const image = await resize(request);
      const response: CodecResponse = { id: request.id, ok: true, image };
      self.postMessage(response, [image.data.buffer]);
    } else {
      const buffer = await encode(request);
      const response: CodecResponse = { id: request.id, ok: true, buffer };
      self.postMessage(response, [buffer]);
    }
  } catch (error) {
    const response: CodecResponse = { id: request.id, ok: false, error: error instanceof Error ? error.message : String(error) };
    self.postMessage(response);
  }
};
