/**
 * @jest-environment node
 */

import { Writable } from "node:stream";

import { writeReadableStreamToWritable } from "../stream";

describe("writeReadableStreamToWritable", () => {
  it("respects writable backpressure", async () => {
    let highWaterMark = 16;
    let chunkSize = 8;
    let numChunks = 100;
    let writeDelayMs = 5;

    let writable: Writable = new Writable({
      highWaterMark,
      write(_chunk, _encoding, callback) {
        setTimeout(callback, writeDelayMs);
      },
    });

    let maxBufferedLength = 0;
    let originalWrite = writable.write.bind(writable);
    writable.write = function (chunk: any, ...rest: any[]) {
      let result = originalWrite(chunk, ...rest);
      maxBufferedLength = Math.max(maxBufferedLength, writable.writableLength);
      return result;
    } as typeof writable.write;

    let readable = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < numChunks; i++) {
          controller.enqueue(new Uint8Array(chunkSize));
        }
        controller.close();
      },
    });

    await writeReadableStreamToWritable(readable, writable);

    expect(maxBufferedLength).toBeLessThanOrEqual(highWaterMark + chunkSize);
  });
});
