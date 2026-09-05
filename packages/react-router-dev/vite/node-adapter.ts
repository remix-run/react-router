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
    // The dev server speaks HTTP itself, so `X-Forwarded-Proto` from a reverse
    // proxy is honored to keep `request.url`'s origin in sync with the browser
    // (e.g. for action origin validation). `X-Forwarded-Host` is deliberately
    // ignored: Vite only validates the `Host` header against
    // `server.allowedHosts`, so trusting it would bypass that check.
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
