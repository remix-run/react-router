import * as React from "react";
import { ResultType, UNSAFE_ErrorResponseImpl } from "react-router-dom";
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from "react-router-dom/server.js";
import { encode } from "turbo-stream";

import { globRoutes } from "./glob-routes.js";
import { renderToReadableStream } from "./render-to-readable-stream.node.js";

const routes = globRoutes(import.meta.glob("./routes/**/route.tsx"));

export async function render(
  request: Request,
  {
    bootstrapModules,
    bootstrapScriptContent,
  }: { bootstrapModules?: string[]; bootstrapScriptContent?: string }
) {
  let url = new URL(request.url);
  let isDataRequest = url.pathname.endsWith(".data");
  let xRouteIds = request.headers.get("X-Routes")?.split(",");

  if (isDataRequest) {
    request = new Request(
      new URL(url.pathname.replace(/\.data$/, "") + url.search, url),
      {
        body: request.body,
        headers: request.headers,
        method: request.method,
        signal: request.signal,
      }
    );
  }

  let { query, dataRoutes } = createStaticHandler(routes, {
    async dataStrategy({ defaultStrategy, matches }) {
      if (isDataRequest && xRouteIds?.length) {
        let routesToLoad = new Set(xRouteIds);

        await Promise.all(
          matches
            .filter((m) => routesToLoad.has(m.route.id))
            .map((m) => m.route)
        );
        return Promise.all(
          matches.map((match) => {
            if (!routesToLoad!.has(match.route.id)) {
              return {
                type: ResultType.data,
                data: undefined,
              };
            }

            return defaultStrategy(match);
          })
        );
      }

      await Promise.all(matches.map((m) => m.route));
      return Promise.all(
        matches.map((match) => {
          return defaultStrategy(match);
        })
      );
    },
  });

  let context = await query(request);

  if (isDataRequest) {
    if (context instanceof Response) {
      if (context.status >= 300 && context.status < 400) {
        const headers = new Headers(context.headers);
        headers.set("X-Remix-Redirect", "1");
        headers.set("X-Remix-Location", headers.get("Location") || "/");
        headers.set("X-Remix-Redirect-Status", context.status.toString());
        headers.append("Vary", "X-Routes");

        return new Response(undefined, {
          status: 204,
          headers,
        });
      }
      return context;
    }

    // TODO: handle headers

    return new Response(
      encode({
        actionData: context.actionData,
        loaderData: context.loaderData,
      }),
      {
        status: context.statusCode,
        headers: {
          "Content-Type": "text/turbo-stream; charset=utf-8",
          "Transfer-Encoding": "chunked",
          Vary: "X-Routes",
        },
      }
    );
  }

  if (context instanceof Response) {
    return context;
  }

  let router = createStaticRouter(dataRoutes, context);

  let body = await renderToReadableStream(
    <React.StrictMode>
      <StaticRouterProvider
        router={router}
        context={context}
        nonce="the-nonce"
      />
    </React.StrictMode>,
    {
      onError: console.error,
      bootstrapModules,
      bootstrapScriptContent,
      signal: request.signal,
    }
  );

  // TODO: handle headers

  return new Response(body, {
    status: context.statusCode,
    headers: {
      "Content-Type": "text/html",
      "Transfer-Encoding": "chunked",
    },
  });
}
