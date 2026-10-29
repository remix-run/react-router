import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createReadableStreamFromReadable } from "../../stream.ts";

let missingFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "does-not-exist.txt",
);
let source = createReadStream(missingFile);
let closed = new Promise<void>((resolve) => source.once("close", resolve));
let stream = createReadableStreamFromReadable(source);

// Cancel before the file opens, as happens when a HEAD response drops its body.
await stream.cancel();
assert.equal(source.destroyed, true);
await closed;
assert.equal(source.closed, true);
console.log("process survived");
