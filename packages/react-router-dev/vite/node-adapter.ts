import type { ServerResponse } from "node:http";

import type * as Vite from "vite";
import invariant from "../invariant";

export type NodeRequestHandler = (
  req: Vite.Connect.IncomingMessage,
  res: ServerResponse,
) => Promise<void>;

export async function fromNodeRequest(
  nodeReq: Vite.Connect.IncomingMessage,
  nodeRes: ServerResponse<Vite.Connect.IncomingMessage>,
): Promise<Request> {
  // Use `req.originalUrl` so React Router is aware of the full path
  invariant(
    nodeReq.originalUrl,
    "Expected `nodeReq.originalUrl` to be defined",
  );
  nodeReq.url = nodeReq.originalUrl;

  // Async import here to allow ESM only module on Node 20.18.
  // TODO(v8): Can move to a normal import when Node 20 support
  const { createRequest } = await import("@remix-run/node-fetch-server");
  return createRequest(nodeReq, nodeRes);
}
