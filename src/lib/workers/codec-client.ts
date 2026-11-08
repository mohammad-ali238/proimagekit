import type { CodecRequest, CodecResponse, EncodeRequest, ResizeRequest, WasmFormat } from "./codec-protocol";

type Result = ArrayBuffer | ImageData;
type Pending = { resolve: (result: Result) => void; reject: (error: Error) => void };

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./codec.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (event: MessageEvent<CodecResponse>) => {
    const response = event.data;
    const request = pending.get(response.id);
    if (!request) return;
    pending.delete(response.id);
    if (!response.ok) request.reject(new Error(response.error));
    else request.resolve("image" in response ? response.image : response.buffer);
  };
  worker.onerror = (event) => {
    const error = new Error(event.message || "The image encoder crashed.");
    for (const request of pending.values()) request.reject(error);
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

type RequestBody = Omit<EncodeRequest, "id"> | Omit<ResizeRequest, "id">;

function send(body: RequestBody, transfer: Transferable[]): Promise<Result> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ ...body, id } as CodecRequest, transfer);
  });
}

/** Encodes pixels with a WebAssembly codec in a background worker. The image's buffer is transferred. */
export async function encodeWithWasm(format: WasmFormat, image: ImageData, quality: number): Promise<ArrayBuffer> {
  return (await send({ type: "encode", format, image, quality }, [image.data.buffer])) as ArrayBuffer;
}

/** High-quality Lanczos resize in a background worker. The image's buffer is transferred. */
export async function resizeWithWasm(image: ImageData, width: number, height: number): Promise<ImageData> {
  return (await send({ type: "resize", image, width, height }, [image.data.buffer])) as ImageData;
}
