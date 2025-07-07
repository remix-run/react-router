import * as React from "react";

import type { HydrationState } from "../../router/router";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  RouteManifest,
  ShouldRevalidateFunction,
  ShouldRevalidateFunctionArgs,
} from "../../router/utils";
import { ErrorResponseImpl, compilePath } from "../../router/utils";
import type {
  ClientLoaderFunction,
  RouteModule,
  RouteModules,
} from "./routeModules";
import { loadRouteModule } from "./routeModules";
import type { FutureConfig } from "./entry";
import { prefetchRouteCss, prefetchStyleLinks } from "./links";
import { RemixRootDefaultErrorBoundary } from "./errorBoundaries";
import { RemixRootDefaultHydrateFallback } from "./fallback";
import invariant from "./invariant";
import { useRouteError } from "../../hooks";
import type { DataRouteObject } from "../../context";

export interface Route {
  index?: boolean;
  caseSensitive?: boolean;
  id: string;
  parentId?: string;
  path?: string;
}

export interface EntryRoute extends Route {
  hasAction: boolean;
  hasLoader: boolean;
  hasClientAction: boolean;
  hasClientLoader: boolean;
  hasClientMiddleware: boolean;
  hasErrorBoundary: boolean;
  imports?: string[];
  css?: string[];
  module: string;
  clientActionModule: string | undefined;
  clientLoaderModule: string | undefined;
  clientMiddlewareModule: string | undefined;
  hydrateFallbackModule: string | undefined;
  parentId?: string;
}

// Create a map of routes by parentId to use recursively instead of
// repeatedly filtering the manifest.
function groupRoutesByParentId(manifest: RouteManifest<EntryRoute>) {
  let routes: Record<string, Omit<EntryRoute, "children">[]> = {};

  Object.values(manifest).forEach((route) => {
    if (route) {
      let parentId = route.parentId || "";
      if (!routes[parentId]) {
        routes[parentId] = [];
      }
      routes[parentId].push(route);
    }
  });

  return routes;
}

function getRouteComponents(
  route: EntryRoute,
  routeModule: RouteModule,
  isSpaMode: boolean
) {
  let Component = getRouteModuleComponent(routeModule);
  // HydrateFallback can only exist on the root route in SPA Mode
  let HydrateFallback =
    routeModule.HydrateFallback && (!isSpaMode || route.id === "root")
      ? routeModule.HydrateFallback
      : route.id === "root"
      ? RemixRootDefaultHydrateFallback
      : undefined;
  let ErrorBoundary = routeModule.ErrorBoundary
    ? routeModule.ErrorBoundary
    : route.id === "root"
    ? () => <RemixRootDefaultErrorBoundary error={useRouteError()} />
    : undefined;

  if (route.id === "root" && routeModule.Layout) {
    return {
      ...(Component
        ? {
            element: (
              <routeModule.Layout>
                <Component />
              </routeModule.Layout>
            ),
          }
        : { Component }),
      ...(ErrorBoundary
        ? {
            errorElement: (
              <routeModule.Layout>
                <ErrorBoundary />
              </routeModule.Layout>
            ),
          }
        : { ErrorBoundary }),
      ...(HydrateFallback
        ? {
            hydrateFallbackElement: (
              <routeModule.Layout>
                <HydrateFallback />
              </routeModule.Layout>
            ),
          }
        : { HydrateFallback }),
    };
  }

  return { Component, ErrorBoundary, HydrateFallback };
}

export function createServerRoutes(
  manifest: RouteManifest<EntryRoute>,
  routeModules: RouteModules,
  future: FutureConfig,
  isSpaMode: boolean,
  parentId: string = "",
  routesByParentId: Record<
    string,
    Omit<EntryRoute, "children">[]
  > = groupRoutesByParentId(manifest),
  spaModeLazyPromise = Promise.resolve({ Component: () => null })
): DataRouteObject[] {
  return (routesByParentId[parentId] || []).map((route) => {
    let routeModule = routeModules[route.id];
    invariant(
      routeModule,
      "No `routeModule` available to create server routes"
    );

    let dataRoute: DataRouteObject = {
      ...getRouteComponents(route, routeModule, isSpaMode),
      caseSensitive: route.caseSensitive,
      id: route.id,
      index: route.index,
      path: route.path,
      handle: routeModule.handle,
      // For SPA Mode, all routes are lazy except root.  However we tell the
      // router root is also lazy here too since we don't need a full
      // implementation - we just need a `lazy` prop to tell the RR rendering
      // where to stop which is always at the root route in SPA mode
      lazy: isSpaMode ? () => spaModeLazyPromise : undefined,
      // For partial hydration rendering, we need to indicate when the route
      // has a loader/clientLoader, but it won't ever be called during the static
      // render, so just give it a no-op function so we can render down to the
      // proper fallback
      loader: route.hasLoader || route.hasClientLoader ? () => null : undefined,
      // We don't need middleware/action/shouldRevalidate on these routes since
      // they're for a static render
    };

    let children = createServerRoutes(
      manifest,
      routeModules,
      future,
      isSpaMode,
      route.id,
      routesByParentId,
      spaModeLazyPromise
    );
    if (children.length > 0) dataRoute.children = children;
    return dataRoute;
  });
}

export function createClientRoutesWithHMRRevalidationOptOut(
  needsRevalidation: Set<string>,
  manifest: RouteManifest<EntryRoute>,
  routeModulesCache: RouteModules,
  initialState: HydrationState,
  ssr: boolean,
  isSpaMode: boolean
) {
  return createClientRoutes(
    manifest,
    routeModulesCache,
    initialState,
    ssr,
    isSpaMode,
    "",
    groupRoutesByParentId(manifest),
    needsRevalidation
  );
}

function preventInvalidServerHandlerCall(
  type: "action" | "loader",
  route: Omit<EntryRoute, "children">
) {
  if (
    (type === "loader" && !route.hasLoader) ||
    (type === "action" && !route.hasAction)
  ) {
    let fn = type === "action" ? "serverAction()" : "serverLoader()";
    let msg =
      `You are trying to call ${fn} on a route that does not have a server ` +
      `${type} (routeId: "${route.id}")`;
    console.error(msg);
    throw new ErrorResponseImpl(400, "Bad Request", new Error(msg), true);
  }
}

export function noActionDefinedError(
  type: "action" | "clientAction",
  routeId: string
) {
  let article = type === "clientAction" ? "a" : "an";
  let msg =
    `Route "${routeId}" does not have ${article} ${type}, but you are trying to ` +
    `submit to it. To fix this, please add ${article} \`${type}\` function to the route`;
  console.error(msg);
  throw new ErrorResponseImpl(405, "Method Not Allowed", new Error(msg), true);
}

export function createClientRoutes(
  manifest: RouteManifest<EntryRoute>,
  routeModulesCache: RouteModules,
  initialState: HydrationState | null,
  ssr: boolean,
  isSpaMode: boolean,
  parentId: string = "",
  routesByParentId: Record<
    string,
    Omit<EntryRoute, "children">[]
  > = groupRoutesByParentId(manifest),
  needsRevalidation?: Set<string>
): DataRouteObject[] {
  return (routesByParentId[parentId] || []).map((route) => {
    let routeModule = routeModulesCache[route.id];

    function fetchServerHandler(singleFetch: unknown) {
      invariant(
        typeof singleFetch === "function",
        "No single fetch function available for route handler"
      );
      return singleFetch();
    }

    function fetchServerLoader(singleFetch: unknown) {
      if (!route.hasLoader) return Promise.resolve(null);
      return fetchServerHandler(singleFetch);
    }

    function fetchServerAction(singleFetch: unknown) {
      if (!route.hasAction) {
        throw noActionDefinedError("action", route.id);
      }
      return fetchServerHandler(singleFetch);
    }

    function prefetchModule(modulePath: string) {
      import(
        /* @vite-ignore */
        /* webpackIgnore: true */
        modulePath
      );
    }

    function prefetchRouteModuleChunks(route: EntryRoute) {
      // We fetch the client action module first since the loader function we
      // create internally already handles the client loader. This function is
      // most useful in cases where only the client action is splittable, but is
      // also useful for prefetching the client loader module if a client action
      // is triggered from another route.
      if (route.clientActionModule) {
        prefetchModule(route.clientActionModule);
      }
      // Also prefetch the client loader module if it exists
      // since it's called after the client action
      if (route.clientLoaderModule) {
        prefetchModule(route.clientLoaderModule);
      }
    }

    async function prefetchStylesAndCallHandler(
      handler: () => Promise<unknown>
    ) {
      // Only prefetch links if we exist in the routeModulesCache (critical modules
      // and navigating back to pages previously loaded via route.lazy).  Initial
      // execution of route.lazy (when the module is not in the cache) will handle
      // prefetching style links via loadRouteModuleWithBlockingLinks.
      let cachedModule = routeModulesCache[route.id];
      let linkPrefetchPromise = cachedModule
        ? prefetchStyleLinks(route, cachedModule)
        : Promise.resolve();
      try {
        return handler();
      } finally {
        await linkPrefetchPromise;
      }
    }

    let dataRoute: DataRouteObject = {
      id: route.id,
      index: route.index,
      path: route.path,
    };

    if (routeModule) {
      // Use critical path modules directly
      Object.assign(dataRoute, {
        ...dataRoute,
        ...getRouteComponents(route, routeModule, isSpaMode),
        unstable_middleware: routeModule.unstable_clientMiddleware,
        handle: routeModule.handle,
        shouldRevalidate: getShouldRevalidateFunction(
          dataRoute.path,
          routeModule,
          route,
          ssr,
          needsRevalidation
        ),
      });

      let hasInitialData =
        initialState &&
        initialState.loaderData &&
        route.id in initialState.loaderData;
      let initialData = hasInitialData
        ? initialState?.loaderData?.[route.id]
        : undefined;
      let hasInitialError =
        initialState && initialState.errors && route.id in initialState.errors;
      let initialError = hasInitialError
        ? initialState?.errors?.[route.id]
        : undefined;
      let isHydrationRequest =
        needsRevalidation == null &&
        (routeModule.clientLoader?.hydrate === true || !route.hasLoader);

      dataRoute.loader = async (
        { request, params, context }: LoaderFunctionArgs,
        singleFetch?: unknown
      ) => {
        try {
          let result = await prefetchStylesAndCallHandler(async () => {
            invariant(
              routeModule,
              "No `routeModule` available for critical-route loader"
            );
            if (!routeModule.clientLoader) {
              // Call the server when no client loader exists
              return fetchServerLoader(singleFetch);
            }

            return routeModule.clientLoader({
              request,
              params,
              context,
              async serverLoader() {
                preventInvalidServerHandlerCall("loader", route);

                // On the first call, resolve with the server result
                if (isHydrationRequest) {
                  if (hasInitialData) {
                    return initialData;
                  }
                  if (hasInitialError) {
                    throw initialError;
                  }
                }

                // Call the server loader for client-side navigations
                return fetchServerLoader(singleFetch);
              },
            });
          });
          return result;
        } finally {
          // Whether or not the user calls `serverLoader`, we only let this
          // stick around as true for one loader call
          isHydrationRequest = false;
        }
      };

      // Let React Router know whether to run this on hydration
      dataRoute.loader.hydrate = shouldHydrateRouteLoader(
        route.id,
        routeModule.clientLoader,
        route.hasLoader,
        isSpaMode
      );

      dataRoute.action = (
        { request, params, context }: ActionFunctionArgs,
        singleFetch?: unknown
      ) => {
        return prefetchStylesAndCallHandler(async () => {
          invariant(
            routeModule,
            "No `routeModule` available for critical-route action"
          );
          if (!routeModule.clientAction) {
            if (isSpaMode) {
              throw noActionDefinedError("clientAction", route.id);
            }
            return fetchServerAction(singleFetch);
          }

          return routeModule.clientAction({
            request,
            params,
            context,
            async serverAction() {
              preventInvalidServerHandlerCall("action", route);
              return fetchServerAction(singleFetch);
            },
          });
        });
      };
    } else {
      // If the lazy route does not have a client loader/action we want to call
      // the server loader/action in parallel with the module load so we add
      // loader/action as static props on the route
      if (!route.hasClientLoader) {
        dataRoute.loader = (_: LoaderFunctionArgs, singleFetch?: unknown) =>
          prefetchStylesAndCallHandler(() => {
            return fetchServerLoader(singleFetch);
          });
      }
      if (!route.hasClientAction) {
        dataRoute.action = (_: ActionFunctionArgs, singleFetch?: unknown) =>
          prefetchStylesAndCallHandler(() => {
            if (isSpaMode) {
              throw noActionDefinedError("clientAction", route.id);
            }
            return fetchServerAction(singleFetch);
          });
      }

      let lazyRoutePromise:
        | ReturnType<typeof loadRouteModuleWithBlockingLinks>
        | undefined;
      async function getLazyRoute() {
        if (lazyRoutePromise) {
          return await lazyRoutePromise;
        }
        lazyRoutePromise = (async () => {
          if (route.clientLoaderModule || route.clientActionModule) {
            // If a client loader/action chunk is present, we push the loading of
            // the main route chunk to the next tick to ensure the downloading of
            // loader/action chunks takes precedence. This can be seen via their
            // order in the network tab. Also note that since this is happening
            // within `route.lazy`, this imperceptible delay only happens on the
            // first load of this route.
            await new Promise((resolve) => setTimeout(resolve, 0));
          }

          let routeModulePromise = loadRouteModuleWithBlockingLinks(
            route,
            routeModulesCache
          );
          prefetchRouteModuleChunks(route);
          return await routeModulePromise;
        })();
        return await lazyRoutePromise;
      }

      dataRoute.lazy = {
        loader: route.hasClientLoader
          ? async () => {
              let { clientLoader } = route.clientLoaderModule
                ? await import(
                    /* @vite-ignore */
                    /* webpackIgnore: true */
                    route.clientLoaderModule
                  )
                : await getLazyRoute();
              invariant(clientLoader, "No `clientLoader` export found");
              return (args: LoaderFunctionArgs, singleFetch?: unknown) =>
                clientLoader({
                  ...args,
                  async serverLoader() {
                    preventInvalidServerHandlerCall("loader", route);
                    return fetchServerLoader(singleFetch);
                  },
                });
            }
          : undefined,
        action: route.hasClientAction
          ? async () => {
              let clientActionPromise = route.clientActionModule
                ? import(
                    /* @vite-ignore */
                    /* webpackIgnore: true */
                    route.clientActionModule
                  )
                : getLazyRoute();
              prefetchRouteModuleChunks(route);
              let { clientAction } = await clientActionPromise;
              invariant(clientAction, "No `clientAction` export found");
              return (args: ActionFunctionArgs, singleFetch?: unknown) =>
                clientAction({
                  ...args,
                  async serverAction() {
                    preventInvalidServerHandlerCall("action", route);
                    return fetchServerAction(singleFetch);
                  },
                });
            }
          : undefined,
        unstable_middleware: route.hasClientMiddleware
          ? async () => {
              let { unstable_clientMiddleware } = route.clientMiddlewareModule
                ? await import(
                    /* @vite-ignore */
                    /* webpackIgnore: true */
                    route.clientMiddlewareModule
                  )
                : await getLazyRoute();
              invariant(
                unstable_clientMiddleware,
                "No `unstable_clientMiddleware` export found"
              );
              return unstable_clientMiddleware;
            }
          : undefined,
        shouldRevalidate: async () => {
          let lazyRoute = await getLazyRoute();
          return getShouldRevalidateFunction(
            dataRoute.path,
            lazyRoute,
            route,
            ssr,
            needsRevalidation
          );
        },
        handle: async () => (await getLazyRoute()).handle,
        // No need to wrap these in layout since the root route is never
        // loaded via route.lazy()
        Component: async () => (await getLazyRoute()).Component,
        ErrorBoundary: route.hasErrorBoundary
          ? async () => (await getLazyRoute()).ErrorBoundary
          : undefined,
      };
    }

    let children = createClientRoutes(
      manifest,
      routeModulesCache,
      initialState,
      ssr,
      isSpaMode,
      route.id,
      routesByParentId,
      needsRevalidation
    );
    if (children.length > 0) dataRoute.children = children;
    return dataRoute;
  });
}

function getShouldRevalidateFunction(
  path: string | undefined,
  route: Partial<DataRouteObject>,
  manifestRoute: Omit<EntryRoute, "children">,
  ssr: boolean,
  needsRevalidation: Set<string> | undefined
) {
  // During HDR we force revalidation for updated routes
  if (needsRevalidation) {
    return wrapShouldRevalidateForHdr(
      manifestRoute.id,
      route.shouldRevalidate,
      needsRevalidation
    );
  }

  // When prerendering is enabled with `ssr:false`, any `loader` data is
  // statically generated at build time so if we have a `loader` but not a
  // `clientLoader`, we only revalidate if the route's params changed since we
  // can't be sure if a `.data` file was pre-rendered otherwise.
  //
  // I.e., If I have a parent and a child route and I only prerender `/parent`,
  // we can't have parent revalidate when going from `/parent -> /parent/child`
  // because `/parent/child.data` doesn't exist.
  //
  // If users are somehow re-generating updated versions of these on the backend
  // they can still opt-into revalidation which will make the `.data` request
  if (!ssr && manifestRoute.hasLoader && !manifestRoute.hasClientLoader) {
    let myParams = path ? compilePath(path)[1].map((p) => p.paramName) : [];
    const didParamsChange = (opts: ShouldRevalidateFunctionArgs) =>
      myParams.some((p) => opts.currentParams[p] !== opts.nextParams[p]);

    if (route.shouldRevalidate) {
      let fn = route.shouldRevalidate;
      return (opts: ShouldRevalidateFunctionArgs) =>
        fn({
          ...opts,
          defaultShouldRevalidate: didParamsChange(opts),
        });
    } else {
      return (opts: ShouldRevalidateFunctionArgs) => didParamsChange(opts);
    }
  }

  // Single fetch revalidates by default, so override the RR default value which
  // matches the multi-fetch behavior with `true`
  if (ssr && route.shouldRevalidate) {
    let fn = route.shouldRevalidate;
    return (opts: ShouldRevalidateFunctionArgs) =>
      fn({ ...opts, defaultShouldRevalidate: true });
  }

  return route.shouldRevalidate;
}

// When an HMR / HDR update happens we opt out of all user-defined
// revalidation logic and force a revalidation on the first call
function wrapShouldRevalidateForHdr(
  routeId: string,
  routeShouldRevalidate: ShouldRevalidateFunction | undefined,
  needsRevalidation: Set<string>
): ShouldRevalidateFunction {
  let handledRevalidation = false;
  return (arg) => {
    if (!handledRevalidation) {
      handledRevalidation = true;
      return needsRevalidation.has(routeId);
    }

    return routeShouldRevalidate
      ? routeShouldRevalidate(arg)
      : arg.defaultShouldRevalidate;
  };
}

async function loadRouteModuleWithBlockingLinks(
  route: EntryRoute,
  routeModules: RouteModules
) {
  // Ensure the route module and its static CSS links are loaded in parallel as
  // soon as possible before blocking on the route module
  let routeModulePromise = loadRouteModule(route, routeModules);
  let prefetchRouteCssPromise = prefetchRouteCss(route);

  let routeModule = await routeModulePromise;
  await Promise.all([
    prefetchRouteCssPromise,
    prefetchStyleLinks(route, routeModule),
  ]);

  // Include all `browserSafeRouteExports` fields, except `HydrateFallback`
  // since those aren't used on lazily loaded routes
  return {
    Component: getRouteModuleComponent(routeModule),
    ErrorBoundary: routeModule.ErrorBoundary,
    unstable_clientMiddleware: routeModule.unstable_clientMiddleware,
    clientAction: routeModule.clientAction,
    clientLoader: routeModule.clientLoader,
    handle: routeModule.handle,
    links: routeModule.links,
    meta: routeModule.meta,
    shouldRevalidate: routeModule.shouldRevalidate,
  };
}

// Our compiler generates the default export as `{}` when no default is provided,
// which can lead us to trying to use that as a Component in RR and calling
// createElement on it.  Patching here as a quick fix and hoping it's no longer
// an issue in Vite.
function getRouteModuleComponent(routeModule: RouteModule) {
  if (routeModule.default == null) return undefined;
  let isEmptyObject =
    typeof routeModule.default === "object" &&
    Object.keys(routeModule.default).length === 0;
  if (!isEmptyObject) {
    return routeModule.default;
  }
}

export function shouldHydrateRouteLoader(
  routeId: string,
  clientLoader: ClientLoaderFunction | undefined,
  hasLoader: boolean,
  isSpaMode: boolean
) {
  return (
    (isSpaMode && routeId !== "root") ||
    (clientLoader != null &&
      (clientLoader.hydrate === true || hasLoader !== true))
  );
}
