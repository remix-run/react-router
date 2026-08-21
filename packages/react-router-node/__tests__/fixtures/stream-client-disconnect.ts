import { PassThrough, Writable } from "node:stream";

import {
  createReadableStreamFromReadable,
  writeReadableStreamToWritable,
} from "../../stream.ts";

let source = new PassThrough();
let readable = createReadableStreamFromReadable(source);
let writable = new Writable({
  write(_chunk, _encoding, callback) {
    callback();
  },
});

source.write(Buffer.from("first chunk"));
let writePromise = writeReadableStreamToWritable(readable, writable);

setTimeout(() => writable.emit("close"), 10);

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
