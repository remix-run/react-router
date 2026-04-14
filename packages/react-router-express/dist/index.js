/**
 * @react-router/express v7.14.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var index_exports = {};
__export(index_exports, {
  createRequestHandler: () => createRequestHandler
});
module.exports = __toCommonJS(index_exports);

// server.ts
var import_react_router = require("react-router");
var import_node = require("@react-router/node");
function createRequestHandler({
  build,
  getLoadContext,
  mode = process.env.NODE_ENV
}) {
  let handleRequest = (0, import_react_router.createRequestHandler)(build, mode);
  return async (req, res, next) => {
    try {
      let request = createRemixRequest(req, res);
      let loadContext = await getLoadContext?.(req, res);
      let response = await handleRequest(request, loadContext);
      await sendRemixResponse(res, response);
    } catch (error) {
      next(error);
    }
  };
}
function createRemixHeaders(requestHeaders) {
  let headers = new Headers();
  for (let [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      if (Array.isArray(values)) {
        for (let value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }
  return headers;
}
function createRemixRequest(req, res) {
  let [, hostnamePortStr] = req.get("X-Forwarded-Host")?.split(":") ?? [];
  let [, hostPortStr] = req.get("host")?.split(":") ?? [];
  let hostnamePort = Number.parseInt(hostnamePortStr, 10);
  let hostPort = Number.parseInt(hostPortStr, 10);
  let port = Number.isSafeInteger(hostnamePort) ? hostnamePort : Number.isSafeInteger(hostPort) ? hostPort : "";
  let resolvedHost = `${req.hostname}${port ? `:${port}` : ""}`;
  let url = new URL(`${req.protocol}://${resolvedHost}${req.originalUrl}`);
  let controller = new AbortController();
  let init = {
    method: req.method,
    headers: createRemixHeaders(req.headers),
    signal: controller.signal
  };
  res.on("finish", () => controller = null);
  res.on("close", () => controller?.abort());
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = (0, import_node.createReadableStreamFromReadable)(req);
    init.duplex = "half";
  }
  return new Request(url.href, init);
}
async function sendRemixResponse(res, nodeResponse) {
  res.statusMessage = nodeResponse.statusText;
  res.status(nodeResponse.status);
  for (let [key, value] of nodeResponse.headers.entries()) {
    res.append(key, value);
  }
  if (nodeResponse.headers.get("Content-Type")?.match(/text\/event-stream/i)) {
    res.flushHeaders();
  }
  if (nodeResponse.body) {
    await (0, import_node.writeReadableStreamToWritable)(nodeResponse.body, res);
  } else {
    res.end();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createRequestHandler
});
