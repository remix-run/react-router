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
    // Honor the browser-facing protocol behind an HTTPS-terminating proxy so
    // action origin validation sees the correct origin. Keep using Host:
    // Vite's allowedHosts checks do not validate X-Forwarded-Host.
    protocol: getForwardedProtocol(nodeReq),
  });
}

function getForwardedProtocol(
  nodeReq: Vite.Connect.IncomingMessage,
): string | undefined {
  let forwardedProto = nodeReq.headers["x-forwarded-proto"];
  let proto = (
    Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto
  )
    ?.split(",")[0]
    .trim()
    .toLowerCase();
  if (proto?.endsWith(":")) {
    proto = proto.slice(0, -1);
  }
  return proto === "http" || proto === "https" ? `${proto}:` : undefined;
}
