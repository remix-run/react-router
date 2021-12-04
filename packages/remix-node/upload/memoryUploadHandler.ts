import type { TransformCallback } from "stream";
import { Transform } from "stream";
import { File as BufferFile } from "@web-std/file";

import { Meter } from "./meter";
import type { UploadHandler } from "../formData";

export type MemoryUploadHandlerFilterArgs = {
  filename: string;
  encoding: string;
  mimetype: string;
};

export type MemoryUploadHandlerOptions = {
  /**
   * The maximum upload size allowed. If the size is exceeded an error will be thrown.
   * Defaults to 3000000B (3MB).
   */
  maxFileSize?: number;
  /**
   *
   * @param filename
   * @param mimetype
   * @param encoding
   */
  filter?(args: MemoryUploadHandlerFilterArgs): boolean | Promise<boolean>;
};

export function createMemoryUploadHandler({
  filter,
  maxFileSize = 3000000
}: MemoryUploadHandlerOptions): UploadHandler {
  return async ({ name, stream, filename, encoding, mimetype }) => {
    if (filter && !(await filter({ filename, encoding, mimetype }))) {
      stream.resume();
      return;
    }

    let bufferStream = new BufferStream();
    await new Promise<void>((resolve, reject) => {
      let meter = new Meter(name, maxFileSize);

      let aborted = false;
      async function abort(error: Error) {
        if (aborted) return;
        aborted = true;

        stream.unpipe();
        meter.unpipe();
        stream.removeAllListeners();
        meter.removeAllListeners();
        bufferStream.removeAllListeners();

        reject(error);
      }

      stream.on("error", abort);
      meter.on("error", abort);
      bufferStream.on("error", abort);
      bufferStream.on("finish", resolve);

      stream.pipe(meter).pipe(bufferStream);
    });

    return new BufferFile(bufferStream.data, filename, {
      type: mimetype
    });
  };
}

class BufferStream extends Transform {
  public data: any[];

  constructor() {
    super();
    this.data = [];
  }

  _transform(chunk: any, _: BufferEncoding, callback: TransformCallback) {
    this.data.push(chunk);
    callback();
  }
}
