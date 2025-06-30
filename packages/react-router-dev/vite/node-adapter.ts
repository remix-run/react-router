import { once } from "node:events";
import type { IncomingMessage, ServerResponse } from "node:http";
import { TLSSocket } from "node:tls";
import { Readable } from "node:stream";
import { splitCookiesString } from "set-cookie-parser";
import { createReadableStreamFromReadable } from "@react-router/node";
import type * as Vite from "vite";

import invariant from "../invariant";

export type NodeRequestHandler = (
  req: Vite.Connect.IncomingMessage,
  res: ServerResponse
) => Promise<void>;

function fromNodeHeaders(nodeReq: IncomingMessage): Headers {
  let nodeHeaders = nodeReq.headers;

  if (nodeReq.httpVersionMajor >= 2) {
    nodeHeaders = { ...nodeHeaders };
    if (nodeHeaders[":authority"]) {
      nodeHeaders.host = nodeHeaders[":authority"] as string;
    }
    delete nodeHeaders[":authority"];
    delete nodeHeaders[":method"];
    delete nodeHeaders[":path"];
    delete nodeHeaders[":scheme"];
  }

  let headers = new Headers();

  for (let [key, values] of Object.entries(nodeHeaders)) {
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

// Based on `createRemixRequest` in packages/react-router-express/server.ts
export function fromNodeRequest(
  nodeReq: Vite.Connect.IncomingMessage,
  nodeRes: ServerResponse<Vite.Connect.IncomingMessage>
): Request {
  let protocol =
    nodeReq.socket instanceof TLSSocket && nodeReq.socket.encrypted
      ? "https"
      : "http";
  let origin =
    nodeReq.headers.origin && "null" !== nodeReq.headers.origin
      ? nodeReq.headers.origin
      : `${protocol}://${nodeReq.headers.host}`;
  // Use `req.originalUrl` so React Router is aware of the full path
  invariant(
    nodeReq.originalUrl,
    "Expected `nodeReq.originalUrl` to be defined"
  );
  let url = new URL(nodeReq.originalUrl, origin);

  // Abort action/loaders once we can no longer write a response
  let controller: AbortController | null = new AbortController();
  let init: RequestInit = {
    method: nodeReq.method,
    headers: fromNodeHeaders(nodeReq),
    signal: controller.signal,
  };

  // Abort action/loaders once we can no longer write a response iff we have
  // not yet sent a response (i.e., `close` without `finish`)
  // `finish` -> done rendering the response
  // `close` -> response can no longer be written to
  nodeRes.on("finish", () => (controller = null));
  nodeRes.on("close", () => controller?.abort());

  if (nodeReq.method !== "GET" && nodeReq.method !== "HEAD") {
    init.body = createReadableStreamFromReadable(nodeReq);
    (init as { duplex: "half" }).duplex = "half";
  }

  return new Request(url.href, init);
}

// Adapted from solid-start's `handleNodeResponse`:
// https://github.com/solidjs/solid-start/blob/7398163869b489cce503c167e284891cf51a6613/packages/start/node/fetch.js#L162-L185
export async function toNodeRequest(res: Response, nodeRes: ServerResponse) {
  nodeRes.statusCode = res.status;

  // HTTP/2 doesn't support status messages
  // https://datatracker.ietf.org/doc/html/rfc7540#section-8.1.2.4
  if (!nodeRes.req || nodeRes.req.httpVersionMajor < 2) {
    nodeRes.statusMessage = res.statusText;
  }

  let cookiesStrings = [];

  for (let [name, value] of res.headers) {
    if (name === "set-cookie") {
      cookiesStrings.push(...splitCookiesString(value));
    } else nodeRes.setHeader(name, value);
  }

  if (cookiesStrings.length) {
    nodeRes.setHeader("set-cookie", cookiesStrings);
  }

  if (res.body) {
    // https://github.com/microsoft/TypeScript/issues/29867
    let responseBody = res.body as unknown as AsyncIterable<Uint8Array>;
    let readable = Readable.from(responseBody);
    readable.pipe(nodeRes);
    await once(readable, "end");
  } else {
    nodeRes.end();
  }
}
