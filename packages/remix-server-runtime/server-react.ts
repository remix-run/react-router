import type { StaticHandler } from "@remix-run/router";

import type {
  HandleErrorFunction,
  RenderToReadableStreamFunction,
  ReactServerBuild,
} from "./build";
import type { AppLoadContext } from "./data";
import { sanitizeErrors } from "./errors";
import type { ServerMode } from "./mode";
import type { ServerRoute } from "./routes";
import { derive } from "./server";
import {
  type SingleFetchResults,
  SingleFetchRedirectSymbol,
  getResponseStubs,
  getSingleFetchDataStrategy,
  getSingleFetchRedirect,
  isResponseStub,
  mergeResponseStubs,
} from "./single-fetch";
import { isRedirectStatusCode, isResponse } from "./responses";

export type ReactRequestHandler = (
  request: Request,
  loadContext?: AppLoadContext
) => Promise<Response>;

function createRSCDataStrategy() {
  // TODO: Implement this
  return undefined;
}

export function createReactServerRequestHandler(
  build: ReactServerBuild | (() => Promise<ReactServerBuild>),
  mode?: string,
  handleError?: HandleErrorFunction
): ReactRequestHandler {
  let _build: ReactServerBuild;
  let routes: ServerRoute[];
  let serverMode: ServerMode;
  let staticHandler: StaticHandler;
  let errorHandler: HandleErrorFunction;
  let renderToReadableStream: RenderToReadableStreamFunction;

  return async (request, loadContext) => {
    _build = typeof build === "function" ? await build() : build;
    mode ??= _build.mode;
    if (!_build.entry.module.renderToReadableStream) {
      throw new Error(
        "The react server build does not have a renderToReadableStream function"
      );
    }
    renderToReadableStream = _build.entry.module.renderToReadableStream;

    if (typeof build === "function") {
      // TODO: TYPE THIS RIGHT
      let derived = derive(_build as any, mode);
      routes = derived.routes;
      serverMode = derived.serverMode;
      staticHandler = derived.staticHandler;
      errorHandler = derived.errorHandler;
    } else if (!routes || !serverMode || !staticHandler || !errorHandler) {
      // TODO: TYPE THIS RIGHT
      let derived = derive(_build as any, mode);
      routes = derived.routes;
      serverMode = derived.serverMode;
      staticHandler = derived.staticHandler;
      errorHandler = derived.errorHandler;
    }

    // TODO: Get these from the request somehow
    let loadRouteIds =
      new URL(request.url).searchParams.get("_routes")?.split(",") || undefined;

    let responseStubs = getResponseStubs();

    const context = await staticHandler.query(request, {
      requestContext: loadContext,
      loadRouteIds,
      unstable_dataStrategy: getSingleFetchDataStrategy(responseStubs),
    });

    let results: any = {};
    let headers = new Headers();
    let statusCode = 200;
    if (isResponse(context)) {
      results = {
        result: {
          [SingleFetchRedirectSymbol]: getSingleFetchRedirect(
            context.status,
            context.headers
          ),
        },
        headers: context.headers,
        status: 200, // Don't want the `fetch` call to follow the redirect
      };
    } else {
      let merged = mergeResponseStubs(context, responseStubs);
      statusCode = merged.statusCode;
      headers = merged.headers;

      if (isRedirectStatusCode(statusCode) && headers.has("Location")) {
        results = {
          result: {
            [SingleFetchRedirectSymbol]: getSingleFetchRedirect(
              statusCode,
              headers
            ),
          },
          headers,
          status: 200, // Don't want the `fetch` call to follow the redirect
        };
      }

      // Sanitize errors outside of development environments
      if (context.errors) {
        Object.values(context.errors).forEach((err) => {
          // @ts-expect-error This is "private" from users but intended for internal use
          if (!isRouteErrorResponse(err) || err.error) {
            // handleError?.(err, {});
            console.error(err);
            // TODO: Call handleError
          }
        });
        context.errors = sanitizeErrors(context.errors, serverMode);
      }

      // Aggregate results based on the matches we intended to load since we get
      // `null` values back in `context.loaderData` for routes we didn't load
      let loadedMatches = loadRouteIds
        ? context.matches.filter(
            (m) => m.route.loader && loadRouteIds!.includes(m.route.id)
          )
        : context.matches;

      loadedMatches.forEach((m) => {
        let data = context.loaderData?.[m.route.id];
        let error = context.errors?.[m.route.id];
        if (error !== undefined) {
          if (isResponseStub(error)) {
            results[m.route.id] = { error: null };
          } else {
            results[m.route.id] = { error };
          }
        } else if (data !== undefined) {
          results[m.route.id] = { data };
        }
      });
    }
    // return {
    //   result: results,
    //   headers,
    //   status: statusCode,
    // };

    // if (context instanceof Response) {
    //   // handle redirects
    //   throw new Error("TODO: handle redirects");
    // }

    console.log(results);
    const body = renderToReadableStream(results);

    const responseHeaders = new Headers(headers);
    responseHeaders.set("Content-Type", "text/x-component");
    responseHeaders.append("Vary", "Accept");
    return new Response(body, {
      status: statusCode,
      headers: responseHeaders,
    });
  };
}
