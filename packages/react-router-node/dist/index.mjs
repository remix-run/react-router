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

// server.ts
import { createRequestHandler } from "react-router";
import { createRequestListener as createRequestListener_ } from "@mjackson/node-fetch-server";
function createRequestListener(options) {
  let handleRequest = createRequestHandler(options.build, options.mode);
  return createRequestListener_(async (request, client) => {
    let loadContext = await options.getLoadContext?.(request, client);
    return handleRequest(request, loadContext);
  });
}

// sessions/fileStorage.ts
import { promises as fsp } from "fs";
import * as path from "path";
import { createSessionStorage } from "react-router";
function createFileSessionStorage({
  cookie,
  dir
}) {
  return createSessionStorage({
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
          await fsp.mkdir(path.dirname(file), { recursive: true });
          await fsp.writeFile(file, content, { encoding: "utf-8", flag: "wx" });
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
        let content = JSON.parse(await fsp.readFile(file, "utf-8"));
        let data = content.data;
        let expires = typeof content.expires === "string" ? new Date(content.expires) : null;
        if (!expires || expires > /* @__PURE__ */ new Date()) {
          return data;
        }
        if (expires) await fsp.unlink(file);
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
      await fsp.mkdir(path.dirname(file), { recursive: true });
      await fsp.writeFile(file, content, "utf-8");
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
        await fsp.unlink(file);
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
import { Stream } from "stream";
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
    this.highWaterMark = stream.readableHighWaterMark || new Stream.Readable().readableHighWaterMark;
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
export {
  createFileSessionStorage,
  createReadableStreamFromReadable,
  createRequestListener,
  readableStreamToString,
  writeAsyncIterableToWritable,
  writeReadableStreamToWritable
};
