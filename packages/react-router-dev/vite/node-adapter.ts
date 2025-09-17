import type { ServerResponse } from "node:http";

import { createRequest } from "@remix-run/node-fetch-server";
import type * as Vite from "vite";

import invariant from "../invariant";

export type NodeRequestHandler = (
  req: Vite.Connect.IncomingMessage,
  res: ServerResponse,
) => Promise<void>;

export function fromNodeRequest(
  nodeReq: Vite.Connect.IncomingMessage,
  nodeRes: ServerResponse<Vite.Connect.IncomingMessage>,
): Request {
  // Use `req.originalUrl` so React Router is aware of the full path
  invariant(
    nodeReq.originalUrl,
    "Expected `nodeReq.originalUrl` to be defined",
  );
  nodeReq.url = nodeReq.originalUrl;

  return createRequest(nodeReq, nodeRes);
}
