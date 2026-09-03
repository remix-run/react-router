import type { ServerResponse } from "node:http";
import { createRequest } from "@remix-run/node-fetch-server";
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

  return createRequest(nodeReq, nodeRes, {
    // Vite validates the Host header against server.allowedHosts. Keep that
    // validated host instead of trusting a client-controlled forwarded host.
    host: nodeReq.headers.host ?? "localhost",
    trustProxy: true,
  });
}
