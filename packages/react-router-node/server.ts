import type { RequestListener } from "node:http";

import type { AppLoadContext, ServerBuild } from "react-router";
import { createRequestHandler } from "react-router";
import type { ClientAddress } from "@mjackson/node-fetch-server";
import { createRequestListener as createRequestListener_ } from "@mjackson/node-fetch-server";

export interface RequestListenerOptions {
  build: ServerBuild | (() => ServerBuild | Promise<ServerBuild>);
  getLoadContext?: (
    request: Request,
    client: ClientAddress
  ) => AppLoadContext | Promise<AppLoadContext>;
  mode?: string;
}

/**
 * Creates a request listener that handles requests using Node's built-in HTTP server.
 *
 * @param options Options for creating a request listener.
 * @returns A request listener that can be used with `http.createServer`.
 */
export function createRequestListener(
  options: RequestListenerOptions
): RequestListener {
  let handleRequest = createRequestHandler(options.build, options.mode);

  return createRequestListener_(async (request, client) => {
    let loadContext = await options.getLoadContext?.(request, client);
    return handleRequest(request, loadContext);
  });
}
