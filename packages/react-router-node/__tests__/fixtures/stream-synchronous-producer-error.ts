import assert from "node:assert/strict";
import { Writable } from "node:stream";

import {
  writeAsyncIterableToWritable,
  writeReadableStreamToWritable,
} from "../../stream.ts";

let producerError = new Error("Producer failed after closing the writable");
let writable = new Writable({
  write(_chunk, _encoding, callback) {
    callback();
  },
});

let writePromise: Promise<void>;
if (process.argv[2] === "readable") {
  let enqueued = false;
  let readable = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        if (!enqueued) {
          enqueued = true;
          controller.enqueue(new Uint8Array(1));
          return;
        }

        writable.emit("close");
        controller.error(producerError);
      },
    },
    // Run pull only when the pump requests a chunk, without prefetching.
    { highWaterMark: 0 },
  );
  writePromise = writeReadableStreamToWritable(readable, writable);
} else {
  assert.equal(process.argv[2], "iterable");

  async function* chunks() {
    yield new Uint8Array(1);
    writable.emit("close");
    throw producerError;
  }

  writePromise = writeAsyncIterableToWritable(chunks(), writable);
}

// Either failure can reach the caller, but neither may escape unhandled.
await assert.rejects(
  writePromise,
  (error) =>
    error === producerError ||
    (error instanceof Error &&
      error.message === "Writable closed before stream finished"),
);

// Allow an unhandled producer rejection to terminate this subprocess.
await new Promise((resolve) => setImmediate(resolve));
console.log("process survived");
