import { Writable } from "node:stream";

const { writeReadableStreamToWritable } = await import(
  process.env.STREAM_MODULE_PATH
);

let controller;
let readable = new ReadableStream({
  start(readableController) {
    controller = readableController;
  },
});

let finishDestroy;
let writable = new Writable({
  write(_chunk, _encoding, callback) {
    callback();
  },
  destroy(error, callback) {
    finishDestroy = () => callback(error);
  },
});

let writePromise = writeReadableStreamToWritable(readable, writable);
let writableError = new Error("Writable failed");

// Node marks the writable as destroyed before its destroy callback completes.
writable.destroy(writableError);

// Let the pending read complete while the writable's error is not yet emitted.
controller.enqueue(new Uint8Array(1));

// Wait for the stream pump to observe the destroyed state and clean up.
await writePromise.catch(() => {});

// Completing destruction schedules the writable's error after the stream
// monitor's cleanup path has run.
finishDestroy();
await new Promise((resolve) => setImmediate(resolve));
console.log("process survived");
