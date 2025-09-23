import { PassThrough } from "node:stream";

import type { AppLoadContext, EntryContext } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { renderToPipeableStream } from "react-dom/server";
import type { RequestHandler } from "react-router";
import { log } from "./o11y";
import type { ServerBuild } from "react-router";
import type { DataRouteObject } from "react-router";
import type { MiddlewareFunction } from "react-router";

export const streamTimeout = 5_000;

export function unstable_instrumentHandler(
  handler: RequestHandler,
): RequestHandler {
  let instrumented: RequestHandler = async (request, context) => {
    let pattern = new URL(request.url).pathname;
    return await log([`request`, pattern], () => handler(request, context));
  };
  return instrumented;
}

export function unstable_instrumentRoute(
  route: DataRouteObject,
): DataRouteObject {
  if (route.middleware && route.middleware.length > 0) {
    route.middleware = route.middleware.map((mw, i) => {
      return (...args: Parameters<MiddlewareFunction<Response>>) =>
        log(["middleware", route.id, i.toString(), args[0].pattern], async () =>
          mw(...args),
        );
    }) as MiddlewareFunction<unknown>[];
  }

  if (typeof route.loader === "function") {
    let loader = route.loader;
    route.loader = (...args) => {
      return log([`loader:${route.id}`, args[0].pattern], async () =>
        loader(...args),
      );
    };
  }

  return route;
}

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext,
  // If you have middleware enabled:
  // loadContext: RouterContextProvider
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");

    // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
    // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
    let readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? "onAllReady"
        : "onShellReady";

    // Abort the rendering stream after the `streamTimeout` so it has time to
    // flush down the rejected boundaries
    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => abort(),
      streamTimeout + 1000,
    );

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              // Clear the timeout to prevent retaining the closure and memory leak
              clearTimeout(timeoutId);
              timeoutId = undefined;
              callback();
            },
          });
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          pipe(body);

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );
  });
}
