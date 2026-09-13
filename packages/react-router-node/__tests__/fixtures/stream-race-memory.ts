import { Writable } from "node:stream";

import { writeReadableStreamToWritable } from "../../stream.ts";

// Racing every read against one long-lived promise appends a reaction record
// to that promise which is only released when it settles, so the monitor grows
// without bound for as long as the stream runs.
// https://github.com/nodejs/node/issues/17469
let numChunks = 300_000;

let gc = globalThis.gc!;

function heapUsedAfterGc() {
  gc();
  gc();
  return process.memoryUsage().heapUsed;
}

let baseline = 0;
let peak = 0;

let enqueued = 0;
let readable = new ReadableStream<Uint8Array>({
  pull(controller) {
    if (enqueued === numChunks) {
      // Sample while the stream is still running: once it finishes the monitor
      // becomes unreachable and anything it retained is collected either way.
      peak = heapUsedAfterGc();
      controller.close();
      return;
    }

    if (enqueued === 0) {
      baseline = heapUsedAfterGc();
    }

    enqueued++;
    controller.enqueue(new Uint8Array(1));
  },
});

let writable = new Writable({
  write(_chunk, _encoding, callback) {
    callback();
  },
});

await writeReadableStreamToWritable(readable, writable);

let retained = peak - baseline;
// The leak retains tens of MB here while a healthy run stays near zero.
let maxRetained = 8 * 1024 * 1024;

if (retained > maxRetained) {
  console.error(
    `retained ${(retained / 1024 / 1024).toFixed(2)} MB after ` +
      `${numChunks} chunks, expected less than ` +
      `${(maxRetained / 1024 / 1024).toFixed(2)} MB`,
  );
  process.exit(1);
}

console.log("process survived");
