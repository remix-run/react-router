/**
 * @react-router/node v7.14.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var index_exports = {};
__export(index_exports, {
  createFileSessionStorage: () => createFileSessionStorage,
  createReadableStreamFromReadable: () => createReadableStreamFromReadable,
  createRequestListener: () => createRequestListener,
  readableStreamToString: () => readableStreamToString,
  writeAsyncIterableToWritable: () => writeAsyncIterableToWritable,
  writeReadableStreamToWritable: () => writeReadableStreamToWritable
});
module.exports = __toCommonJS(index_exports);

// server.ts
var import_react_router = require("react-router");
var import_node_fetch_server = require("@mjackson/node-fetch-server");
function createRequestListener(options) {
  let handleRequest = (0, import_react_router.createRequestHandler)(options.build, options.mode);
  return (0, import_node_fetch_server.createRequestListener)(async (request, client) => {
    let loadContext = await options.getLoadContext?.(request, client);
    return handleRequest(request, loadContext);
  });
}

// sessions/fileStorage.ts
var import_node_fs = require("fs");
var path = __toESM(require("path"));
var import_react_router2 = require("react-router");
function createFileSessionStorage({
  cookie,
  dir
}) {
  return (0, import_react_router2.createSessionStorage)({
    cookie,
    async createData(data, expires) {
      let content = JSON.stringify({ data, expires });
      while (true) {
        let randomBytes = crypto.getRandomValues(new Uint8Array(8));
        let id = Buffer.from(randomBytes).toString("hex");
        try {
          let file = getFile(dir, id);
          if (!file) {
            throw new Error("Error generating session");
          }
          await import_node_fs.promises.mkdir(path.dirname(file), { recursive: true });
          await import_node_fs.promises.writeFile(file, content, { encoding: "utf-8", flag: "wx" });
          return id;
        } catch (error) {
          if (error.code !== "EEXIST") throw error;
        }
      }
    },
    async readData(id) {
      try {
        let file = getFile(dir, id);
        if (!file) {
          return null;
        }
        let content = JSON.parse(await import_node_fs.promises.readFile(file, "utf-8"));
        let data = content.data;
        let expires = typeof content.expires === "string" ? new Date(content.expires) : null;
        if (!expires || expires > /* @__PURE__ */ new Date()) {
          return data;
        }
        if (expires) await import_node_fs.promises.unlink(file);
        return null;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        return null;
      }
    },
    async updateData(id, data, expires) {
      let content = JSON.stringify({ data, expires });
      let file = getFile(dir, id);
      if (!file) {
        return;
      }
      await import_node_fs.promises.mkdir(path.dirname(file), { recursive: true });
      await import_node_fs.promises.writeFile(file, content, "utf-8");
    },
    async deleteData(id) {
      if (!id) {
        return;
      }
      let file = getFile(dir, id);
      if (!file) {
        return;
      }
      try {
        await import_node_fs.promises.unlink(file);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
  });
}
function getFile(dir, id) {
  if (!/^[0-9a-f]{16}$/i.test(id)) {
    return null;
  }
  return path.join(dir, id.slice(0, 4), id.slice(4));
}

// stream.ts
var import_node_stream = require("stream");
async function writeReadableStreamToWritable(stream, writable) {
  let reader = stream.getReader();
  let flushable = writable;
  try {
    while (true) {
      let { done, value } = await reader.read();
      if (done) {
        writable.end();
        break;
      }
      writable.write(value);
      if (typeof flushable.flush === "function") {
        flushable.flush();
      }
    }
  } catch (error) {
    writable.destroy(error);
    throw error;
  }
}
async function writeAsyncIterableToWritable(iterable, writable) {
  try {
    for await (let chunk of iterable) {
      writable.write(chunk);
    }
    writable.end();
  } catch (error) {
    writable.destroy(error);
    throw error;
  }
}
async function readableStreamToString(stream, encoding) {
  let reader = stream.getReader();
  let chunks = [];
  while (true) {
    let { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks).toString(encoding);
}
var createReadableStreamFromReadable = (source) => {
  let pump = new StreamPump(source);
  let stream = new ReadableStream(pump, pump);
  return stream;
};
var StreamPump = class {
  highWaterMark;
  accumulatedSize;
  stream;
  controller;
  constructor(stream) {
    this.highWaterMark = stream.readableHighWaterMark || new import_node_stream.Stream.Readable().readableHighWaterMark;
    this.accumulatedSize = 0;
    this.stream = stream;
    this.enqueue = this.enqueue.bind(this);
    this.error = this.error.bind(this);
    this.close = this.close.bind(this);
  }
  size(chunk) {
    return chunk?.byteLength || 0;
  }
  start(controller) {
    this.controller = controller;
    this.stream.on("data", this.enqueue);
    this.stream.once("error", this.error);
    this.stream.once("end", this.close);
    this.stream.once("close", this.close);
  }
  pull() {
    this.resume();
  }
  cancel(reason) {
    if (this.stream.destroy) {
      this.stream.destroy(reason);
    }
    this.stream.off("data", this.enqueue);
    this.stream.off("error", this.error);
    this.stream.off("end", this.close);
    this.stream.off("close", this.close);
  }
  enqueue(chunk) {
    if (this.controller) {
      try {
        let bytes = chunk instanceof Uint8Array ? chunk : Buffer.from(chunk);
        let available = (this.controller.desiredSize || 0) - bytes.byteLength;
        this.controller.enqueue(bytes);
        if (available <= 0) {
          this.pause();
        }
      } catch (error) {
        this.controller.error(
          new Error(
            "Could not create Buffer, chunk must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object"
          )
        );
        this.cancel();
      }
    }
  }
  pause() {
    if (this.stream.pause) {
      this.stream.pause();
    }
  }
  resume() {
    if (this.stream.readable && this.stream.resume) {
      this.stream.resume();
    }
  }
  close() {
    if (this.controller) {
      this.controller.close();
      delete this.controller;
    }
  }
  error(error) {
    if (this.controller) {
      this.controller.error(error);
      delete this.controller;
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createFileSessionStorage,
  createReadableStreamFromReadable,
  createRequestListener,
  readableStreamToString,
  writeAsyncIterableToWritable,
  writeReadableStreamToWritable
});
