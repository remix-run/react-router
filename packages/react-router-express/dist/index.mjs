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

// server.ts
import { createRequestHandler as createRemixRequestHandler } from "react-router";
import {
  createReadableStreamFromReadable,
  writeReadableStreamToWritable
} from "@react-router/node";
function createRequestHandler({
  build,
  getLoadContext,
  mode = process.env.NODE_ENV
}) {
  let handleRequest = createRemixRequestHandler(build, mode);
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
    init.body = createReadableStreamFromReadable(req);
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
    await writeReadableStreamToWritable(nodeResponse.body, res);
  } else {
    res.end();
  }
}
export {
  createRequestHandler
};
