// @ts-expect-error
import RefreshRuntime from "/@react-refresh";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  matchRoutes,
  ResultType,
  RouterProvider,
  type DataRouteObject,
} from "react-router-dom";
import { decode } from "turbo-stream";

import { globRoutes } from "./glob-routes.js";

const routes = globRoutes(import.meta.glob("./routes/**/route.tsx"));

async function initializeRoutes(routes: DataRouteObject[]) {
  // Determine if any of the initial routes are lazy
  let lazyMatches = matchRoutes(routes, window.location)?.filter(
    (m) => m.route.lazy
  );

  // Load the lazy matches and update the routes before creating your router
  // so we can hydrate the SSR-rendered content synchronously
  if (lazyMatches && lazyMatches?.length > 0) {
    await Promise.all(
      lazyMatches.map(async (m) => {
        let routeModule = await m.route.lazy!();
        Object.assign(m.route, { ...routeModule, lazy: undefined });
      })
    );
  }
}

if (import.meta.env.DEV) {
  RefreshRuntime.injectIntoGlobalHook(window);
  // @ts-expect-error
  window.$RefreshReg$ = () => {};
  // @ts-expect-error
  window.$RefreshSig$ = () => (type) => type;
  // @ts-expect-error
  window.__vite_plugin_react_preamble_installed__ = true;
}

initializeRoutes(routes)
  .then(() => {
    const router = createBrowserRouter(routes, {
      async dataStrategy({ matches, request, type }) {
        const singleFetchURL = new URL(request.url);
        singleFetchURL.pathname = singleFetchURL.pathname + ".data";

        const singleFetchHeaders = new Headers(request.headers);
        singleFetchHeaders.set(
          "X-Routes",
          matches.map((m) => m.route.id).join(",")
        );

        const singleFetchRequest = new Request(singleFetchURL, {
          body: request.body,
          headers: singleFetchHeaders,
          method: request.method,
          signal: request.signal,
        });

        try {
          const singleFetchResponse = await fetch(singleFetchRequest);
          const decoded = await decode(singleFetchResponse.body!);
          const data = decoded.value as {
            actionData?: Record<string, unknown>;
            loaderData?: Record<string, unknown>;
          };

          return matches.map((m) => ({
            type: ResultType.data,
            data: data[`${type}Data`]?.[m.route.id],
          }));
        } catch (error) {
          return [
            {
              type: ResultType.error,
              error: error,
            },
          ];
        }
      },
    });

    React.startTransition(() => {
      ReactDOM.hydrateRoot(
        document,
        <React.StrictMode>
          <RouterProvider router={router} fallbackElement={null} />
        </React.StrictMode>
      );
    });
  })
  .catch(console.error);
