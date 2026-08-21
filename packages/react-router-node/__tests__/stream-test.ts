/**
 * @jest-environment node
 */

import { Writable } from "node:stream";
import v8 from "node:v8";
import vm from "node:vm";

import {
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

function getGarbageCollector(): () => void {
  let globalWithGc = globalThis as typeof globalThis & { gc?: () => void };
  if (typeof globalWithGc.gc === "function") {
    return globalWithGc.gc;
  }

  v8.setFlagsFromString("--expose-gc");
  return vm.runInNewContext("gc") as () => void;
}

async function collectGarbage(gc: () => void) {
  for (let i = 0; i < 5; i++) {
    gc();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
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

  it("does not retain written chunks while waiting for the next chunk", async () => {
    let gc = getGarbageCollector();
    let numChunks = 500;
    let chunkSize = 16 * 1024;
    let refs: WeakRef<Uint8Array>[] = [];
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    let resolveChunksWritten!: () => void;
    let chunksWritten = new Promise<void>((resolve) => {
      resolveChunksWritten = resolve;
    });
    let writeCount = 0;

    let readable = new ReadableStream<Uint8Array>({
      start(readableController) {
        controller = readableController;

        for (let i = 0; i < numChunks; i++) {
          let chunk = new Uint8Array(chunkSize);
          refs.push(new WeakRef(chunk));
          readableController.enqueue(chunk);
        }
      },
    });
    let writable = new Writable({
      highWaterMark: numChunks * chunkSize,
      write(_chunk, _encoding, callback) {
        writeCount++;
        if (writeCount === numChunks) {
          resolveChunksWritten();
        }
        callback();
      },
    });

    let writePromise = writeReadableStreamToWritable(readable, writable);

    try {
      await chunksWritten;
      await collectGarbage(gc);

      let retainedChunks = refs.filter((ref) => ref.deref()).length;
      expect(retainedChunks).toBeLessThan(numChunks / 10);
    } finally {
      controller.close();
      await writePromise.catch(() => {});
    }
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
