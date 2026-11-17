import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { createReadableStreamFromReadable } = await import(
  process.env.STREAM_MODULE_PATH
);
let missingFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "does-not-exist.txt",
);
let source = createReadStream(missingFile);
let closed = new Promise((resolve) => source.once("close", resolve));
let stream = createReadableStreamFromReadable(source);
await stream.cancel();
assert.equal(source.destroyed, true);
await closed;
assert.equal(source.closed, true);
console.log("process survived");
