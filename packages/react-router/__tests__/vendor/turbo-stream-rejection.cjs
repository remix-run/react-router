// Run outside Jest so its own rejection handling cannot hide orphan promises.
const { readFileSync } = require("node:fs");
const { transpileModule, ModuleKind } = require("typescript");
globalThis.__DEV__ = true;

require.extensions[".ts"] = (module, filename) => {
  const { outputText } = transpileModule(readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ModuleKind.CommonJS },
  });
  module._compile(outputText, filename);
};

const { decode } = require("../../vendor/turbo-stream-v2/turbo-stream.ts");
const [failure, observe] = process.argv.slice(2);
const sentinel = new Error("rejection checkpoint");
const unhandled = [];
const result = { done: "ignored", deferred: "ignored", unhandled };

process.on("unhandledRejection", (reason) => {
  if (reason === sentinel) {
    // All decoder microtasks have run before this checkpoint. Leave another
    // turn for any rejection events before reporting the isolated outcome.
    setImmediate(() => console.log(JSON.stringify(result)));
  } else {
    unhandled.push({ name: reason.name, message: reason.message });
  }
});

async function run() {
  let controller;
  const body = new ReadableStream({
    start(c) {
      controller = c;
      c.enqueue(new TextEncoder().encode('[{"_1":2},"deferred",["P",2]]\n'));
    },
  });
  const decoded = await decode(body);
  result.hasDeferred = decoded.value.deferred instanceof Promise;
  if (observe === "observed") {
    result.done = "pending";
    result.deferred = "pending";
    decoded.done.then(
      () => (result.done = "resolved"),
      (reason) =>
        (result.done = { name: reason.name, message: reason.message }),
    );
    decoded.value.deferred.then(
      () => (result.deferred = "resolved"),
      (reason) =>
        (result.deferred = { name: reason.name, message: reason.message }),
    );
  }
  if (failure === "TypeError") {
    controller.error(new TypeError("network error"));
  } else if (failure === "AbortError") {
    controller.error(new DOMException("stream aborted", "AbortError"));
  } else {
    // Keep the stream open: completion must reject without reader.closed.
    controller.enqueue(
      new TextEncoder().encode(failure === "unknown" ? "P999:[1]\n" : "P2:{\n"),
    );
  }
  setImmediate(() => Promise.reject(sentinel));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
