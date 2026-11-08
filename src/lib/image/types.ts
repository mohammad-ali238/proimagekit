/** The output of any batch image tool (converter, compressor, resizer…). */
export interface ProcessedImage {
  blob: Blob;
  /** Download file name. */
  name: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  /** Extra information shown next to the result, e.g. "Already optimised". */
  note?: string;
}
