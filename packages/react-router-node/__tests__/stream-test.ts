/**
 * @jest-environment node
 */

import { PassThrough, Writable } from "node:stream";

import {
  createReadableStreamFromReadable,
  writeAsyncIterableToWritable,
  writeReadableStreamToWritable,
} from "../stream";

function createBackpressureSamplingWritable(
  highWaterMark: number,
  writeDelayMs: number,
) {
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

  return {
    writable,
    getMaxBufferedLength: () => maxBufferedLength,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout>;
  let timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Timed out")), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() =>
    clearTimeout(timeout),
  );
}

describe("writeReadableStreamToWritable", () => {
  it("respects writable backpressure", async () => {
    let highWaterMark = 16;
    let chunkSize = 8;
    let numChunks = 100;
    let { writable, getMaxBufferedLength } = createBackpressureSamplingWritable(
      highWaterMark,
      5,
    );

    let readable = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < numChunks; i++) {
          controller.enqueue(new Uint8Array(chunkSize));
        }
        controller.close();
      },
    });

    await writeReadableStreamToWritable(readable, writable);

    expect(getMaxBufferedLength()).toBeLessThanOrEqual(
      highWaterMark + chunkSize,
    );
  });

  it("rejects if the writable errors while waiting for the next chunk", async () => {
    let writableError = new Error("Writable failed");
    let writable = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });
    let readable = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(1));
      },
    });

    let writePromise = writeReadableStreamToWritable(readable, writable);

    setTimeout(() => writable.destroy(writableError), 10);

    await expect(withTimeout(writePromise, 100)).rejects.toThrow(
      "Writable failed",
    );
  });
});

describe("writeAsyncIterableToWritable", () => {
  it("respects writable backpressure", async () => {
    let highWaterMark = 16;
    let chunkSize = 8;
    let numChunks = 100;
    let { writable, getMaxBufferedLength } = createBackpressureSamplingWritable(
      highWaterMark,
      5,
    );

    async function* chunks() {
      for (let i = 0; i < numChunks; i++) {
        yield new Uint8Array(chunkSize);
      }
    }

    await writeAsyncIterableToWritable(chunks(), writable);

    expect(getMaxBufferedLength()).toBeLessThanOrEqual(
      highWaterMark + chunkSize,
    );
  });

  it("rejects if the writable closes while waiting for the next chunk", async () => {
    let writable = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });

    async function* chunks() {
      yield new Uint8Array(1);
      await new Promise<never>(() => {});
    }

    let writePromise = writeAsyncIterableToWritable(chunks(), writable);

    setTimeout(() => writable.destroy(), 10);

    await expect(withTimeout(writePromise, 100)).rejects.toThrow(
      "Writable closed before stream finished",
    );
  });
});

describe("createReadableStreamFromReadable", () => {
  it("handles the error emitted asynchronously by destroy() when canceled with a reason", async () => {
    let source = new PassThrough();
    let stream = createReadableStreamFromReadable(source);
    let reader = stream.getReader();

    source.write("<!DOCTYPE html><html>");
    await reader.read();

    // Mirrors a client disconnecting mid-stream: Node's web streams machinery
    // cancels the source stream with an `AbortError`.
    let cancelPromise = reader.cancel(new Error("The operation was aborted"));

    // `destroy(reason)` emits "error" on a later tick, so the pump must keep
    // its "error" listener attached or the emit escalates to an
    // uncaughtException and crashes the process.
    expect(source.listenerCount("error")).toBe(1);

    await cancelPromise;

    // Let `destroy()` flush its asynchronous "error" event, then verify the
    // once-listener consumed it.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(source.listenerCount("error")).toBe(0);
  });

  it("swallows errors emitted by the source after cancelation", async () => {
    let source = new PassThrough();
    let stream = createReadableStreamFromReadable(source);
    let reader = stream.getReader();

    source.write("<!DOCTYPE html><html>");
    await reader.read();

    await reader.cancel();

    expect(source.listenerCount("error")).toBe(1);

    // With no "error" listener attached this `emit` would throw synchronously
    // (ERR_UNHANDLED_ERROR) — the production crash.
    source.emit("error", new Error("premature close"));

    expect(source.listenerCount("error")).toBe(0);
  });
});
