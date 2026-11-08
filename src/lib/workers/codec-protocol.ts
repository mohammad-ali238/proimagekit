/** Messages exchanged with codec.worker.ts. */

export type WasmFormat = "jpeg" | "png" | "webp" | "avif";

export interface EncodeRequest {
  id: number;
  type: "encode";
  format: WasmFormat;
  image: ImageData;
  /** 0–100; ignored for PNG, which is optimised losslessly. */
  quality: number;
}

export interface ResizeRequest {
  id: number;
  type: "resize";
  image: ImageData;
  width: number;
  height: number;
}

export type CodecRequest = EncodeRequest | ResizeRequest;

export type CodecResponse =
  | { id: number; ok: true; buffer: ArrayBuffer }
  | { id: number; ok: true; image: ImageData }
  | { id: number; ok: false; error: string };
