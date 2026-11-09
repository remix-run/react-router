import type { RequestListener } from "node:http";

import type {
  AppLoadContext,
  ServerBuild,
  UNSAFE_MiddlewareEnabled,
  RouterContextProvider,
} from "react-router";
import { createRequestHandler } from "react-router";
import type { ClientAddress } from "@mjackson/node-fetch-server";
import { createRequestListener as createRequestListener_ } from "@mjackson/node-fetch-server";

type MaybePromise<T> = T | Promise<T>;

export interface RequestListenerOptions {
  build: ServerBuild | (() => ServerBuild | Promise<ServerBuild>);
  getLoadContext?: (
    request: Request,
    client: ClientAddress,
  ) => UNSAFE_MiddlewareEnabled extends true
    ? MaybePromise<RouterContextProvider>
    : MaybePromise<AppLoadContext>;
  mode?: string;
}

/**
 * Creates a request listener that handles requests using Node's built-in HTTP server.
 *
 * @param options Options for creating a request listener.
 * @returns A request listener that can be used with `http.createServer`.
 */
export function createRequestListener(
  options: RequestListenerOptions,
): RequestListener {
  let handleRequest = createRequestHandler(options.build, options.mode);

  let listener = createRequestListener_(async (request, client) => {
    let loadContext = await options.getLoadContext?.(request, client);
    return handleRequest(request, loadContext);
  });

  return async (req, res) => {
    try {
      // Request construction can fail before the listener's error handler runs.
      await listener(req, res);
    } catch (error) {
      console.error(error);
      if (res.headersSent || res.destroyed) {
        res.destroy();
      } else {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      }
    }
  };
}
