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
let writable = new Writable({
  write(_chunk, _encoding, callback) {
    callback();
  },
});

controller.enqueue(new Uint8Array(1));
let writePromise = writeReadableStreamToWritable(readable, writable);

await new Promise((resolve) => setImmediate(resolve));
writable.emit("close");

try {
  await writePromise;
} catch (error) {
  if (
    !(error instanceof Error) ||
    error.message !== "Writable closed before stream finished"
  ) {
    throw error;
  }
}

await new Promise((resolve) => setImmediate(resolve));
console.log("process survived");
