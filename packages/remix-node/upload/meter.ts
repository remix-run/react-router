import type { TransformCallback } from "stream";
import { Transform } from "stream";

export class Meter extends Transform {
  public bytes: number;

  constructor(public field: string, public maxBytes: number | undefined) {
    super();
    this.bytes = 0;
  }

  _transform(chunk: any, _: BufferEncoding, callback: TransformCallback) {
    this.bytes += chunk.length;
    this.push(chunk);

    if (typeof this.maxBytes === "number" && this.bytes > this.maxBytes) {
      return callback(new MeterError(this.field, this.maxBytes));
    }

    callback();
  }
}

export class MeterError extends Error {
  constructor(public field: string, public maxBytes: number) {
    super(`Field "${field}" exceeded upload size of ${maxBytes} bytes.`);
  }
}
