import * as React from "react";
import * as ReactDOM from "react-dom";

import { RouterProvider } from "../components";
import {
  RSCRouterContext,
  type DataRouteMatch,
  type DataRouteObject,
} from "../context";
import { FrameworkContext, setIsHydrated } from "../dom/ssr/components";
import type { FrameworkContextObject } from "../dom/ssr/entry";
import { createBrowserHistory, invariant } from "../router/history";
import type { Router as DataRouter, RouterInit } from "../router/router";
import { createRouter, isMutationMethod } from "../router/router";
import type {
  RSCPayload,
  RSCRouteManifest,
  RSCRenderPayload,
} from "./server.rsc";
import type {
  AgnosticDataRouteObject,
  DataStrategyFunction,
  DataStrategyFunctionArgs,
  RouterContextProvider,
} from "../router/utils";
import { ErrorResponseImpl, createContext } from "../router/utils";
import type {
  DecodedSingleFetchResults,
  FetchAndDecodeFunction,
} from "../dom/ssr/single-fetch";
import {
  getSingleFetchDataStrategyImpl,
  singleFetchUrl,
  stripIndexParam,
} from "../dom/ssr/single-fetch";
import { createRequestInit } from "../dom/ssr/data";
import { getHydrationData } from "../dom/ssr/hydration";
import {
  noActionDefinedError,
  shouldHydrateRouteLoader,
} from "../dom/ssr/routes";
import { RSCRouterGlobalErrorBoundary } from "./errorBoundaries";
import type { RouteModules } from "../dom/ssr/routeModules";
import { populateRSCRouteModules } from "./route-modules";

export type BrowserCreateFromReadableStreamFunction = (
  body: ReadableStream<Uint8Array>,
  {
    temporaryReferences,
  }: {
    temporaryReferences: unknown;
  },
) => Promise<unknown>;

export type EncodeReplyFunction = (
  args: unknown[],
  options: { temporaryReferences: unknown },
) => Promise<BodyInit>;

type WindowWithRouterGlobals = Window &
  typeof globalThis & {
    __reactRouterDataRouter: DataRouter;
    __routerInitialized: boolean;
    __routerActionID: number;
  };

/**
 * Create a React `callServer` implementation for React Router.
 *
 * @example
 * import {
 *   createFromReadableStream,
 *   createTemporaryReferenceSet,
 *   encodeReply,
 *   setServerCallback,
 * } from "@vitejs/plugin-rsc/browser";
 * import { unstable_createCallServer as createCallServer } from "react-router";
 *
 * setServerCallback(
 *   createCallServer({
 *     createFromReadableStream,
 *     createTemporaryReferenceSet,
 *     encodeReply,
 *   })
 * );
 *
 * @name unstable_createCallServer
 * @public
 * @category RSC
 * @mode data
 * @param opts Options
 * @param opts.createFromReadableStream Your `react-server-dom-xyz/client`'s
 * `createFromReadableStream`. Used to decode payloads from the server.
 * @param opts.createTemporaryReferenceSet A function that creates a temporary
 * reference set for the [RSC](https://react.dev/reference/rsc/server-components)
 * payload.
 * @param opts.encodeReply Your `react-server-dom-xyz/client`'s `encodeReply`.
 * Used when sending payloads to the server.
 * @param opts.fetch Optional [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
 * implementation. Defaults to global [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch).
 * @returns A function that can be used to call server actions.
 */
export function createCallServer({
  createFromReadableStream,
  createTemporaryReferenceSet,
  encodeReply,
  fetch: fetchImplementation = fetch,
}: {
  createFromReadableStream: BrowserCreateFromReadableStreamFunction;
  createTemporaryReferenceSet: () => unknown;
  encodeReply: EncodeReplyFunction;
  fetch?: (request: Request) => Promise<Response>;
}) {
  const globalVar = window as WindowWithRouterGlobals;

  let landedActionId = 0;
  return async (id: string, args: unknown[]) => {
    let actionId = (globalVar.__routerActionID =
      (globalVar.__routerActionID ??= 0) + 1);

    const temporaryReferences = createTemporaryReferenceSet();
    const payloadPromise = fetchImplementation(
      new Request(location.href, {
        body: await encodeReply(args, { temporaryReferences }),
        method: "POST",
        headers: {
          Accept: "text/x-component",
          "rsc-action-id": id,
        },
      }),
    ).then((response) => {
      if (!response.body) {
        throw new Error("No response body");
      }
      return createFromReadableStream(response.body, {
        temporaryReferences,
      }) as Promise<RSCPayload>;
    });

    React.startTransition(() =>
      // @ts-expect-error - Needs React 19 types
      Promise.resolve(payloadPromise)
        .then(async (payload) => {
          if (payload.type === "redirect") {
            if (payload.reload || isExternalLocation(payload.location)) {
              window.location.href = payload.location;
              return;
            }

            React.startTransition(() => {
              globalVar.__reactRouterDataRouter.navigate(payload.location, {
                replace: payload.replace,
              });
            });
            return;
          }

          if (payload.type !== "action") {
            throw new Error("Unexpected payload type");
          }

          const rerender = await payload.rerender;
          if (
            rerender &&
            landedActionId < actionId &&
            globalVar.__routerActionID <= actionId
          ) {
            if (rerender.type === "redirect") {
              if (rerender.reload || isExternalLocation(rerender.location)) {
                window.location.href = rerender.location;
                return;
              }
              React.startTransition(() => {
                globalVar.__reactRouterDataRouter.navigate(rerender.location, {
                  replace: rerender.replace,
                });
              });
              return;
            }

            React.startTransition(() => {
              let lastMatch: RSCRouteManifest | undefined;
              for (const match of rerender.matches) {
                globalVar.__reactRouterDataRouter.patchRoutes(
                  lastMatch?.id ?? null,
                  [createRouteFromServerManifest(match)],
                  true,
                );
                lastMatch = match;
              }

              (
                window as WindowWithRouterGlobals
              ).__reactRouterDataRouter._internalSetStateDoNotUseOrYouWillBreakYourApp(
                {
                  loaderData: Object.assign(
                    {},
                    globalVar.__reactRouterDataRouter.state.loaderData,
                    rerender.loaderData,
                  ),
                  errors: rerender.errors
                    ? Object.assign(
                        {},
                        globalVar.__reactRouterDataRouter.state.errors,
                        rerender.errors,
                      )
                    : null,
                },
              );
            });
          }
        })
        .catch(() => {}),
    );

    return payloadPromise.then((payload) => {
      if (payload.type !== "action" && payload.type !== "redirect") {
        throw new Error("Unexpected payload type");
      }

      return payload.actionResult;
    });
  };
}

function createRouterFromPayload({
  fetchImplementation,
  createFromReadableStream,
  getContext,
  payload,
}: {
  payload: RSCPayload;
  createFromReadableStream: BrowserCreateFromReadableStreamFunction;
  fetchImplementation: (request: Request) => Promise<Response>;
  getContext: RouterInit["getContext"] | undefined;
}): {
  router: DataRouter;
  routeModules: RouteModules;
} {
  const globalVar = window as WindowWithRouterGlobals;

  if (globalVar.__reactRouterDataRouter && globalVar.__reactRouterRouteModules)
    return {
      router: globalVar.__reactRouterDataRouter,
      routeModules: globalVar.__reactRouterRouteModules,
    };

  if (payload.type !== "render") throw new Error("Invalid payload type");

  globalVar.__reactRouterRouteModules =
    globalVar.__reactRouterRouteModules ?? {};
  populateRSCRouteModules(globalVar.__reactRouterRouteModules, payload.matches);

  let patches = new Map<string, RSCRouteManifest[]>();
  payload.patches?.forEach((patch) => {
    invariant(patch.parentId, "Invalid patch parentId");
    if (!patches.has(patch.parentId)) {
      patches.set(patch.parentId, []);
    }
    patches.get(patch.parentId)?.push(patch);
  });
  let routes = payload.matches.reduceRight((previous, match) => {
    const route: DataRouteObject = createRouteFromServerManifest(
      match,
      payload,
    );
    if (previous.length > 0) {
      route.children = previous;
      let childrenToPatch = patches.get(match.id);
      if (childrenToPatch) {
        route.children.push(
          ...childrenToPatch.map((r) => createRouteFromServerManifest(r)),
        );
      }
    }
    return [route];
  }, [] as DataRouteObject[]);

  globalVar.__reactRouterDataRouter = createRouter({
    routes,
    getContext,
    basename: payload.basename,
    history: createBrowserHistory(),
    hydrationData: getHydrationData({
      state: {
        loaderData: payload.loaderData,
        actionData: payload.actionData,
        errors: payload.errors,
      },
      routes,
      getRouteInfo: (routeId) => {
        let match = payload.matches.find((m) => m.id === routeId);
        invariant(match, "Route not found in payload");
        return {
          clientLoader: match.clientLoader,
          hasLoader: match.hasLoader,
          hasHydrateFallback: match.hydrateFallbackElement != null,
        };
      },
      location: payload.location,
      basename: payload.basename,
      isSpaMode: false,
    }),
    async patchRoutesOnNavigation({ path, signal }) {
      if (discoveredPaths.has(path)) {
        return;
      }
      await fetchAndApplyManifestPatches(
        [path],
        createFromReadableStream,
        fetchImplementation,
        signal,
      );
    },
    // FIXME: Pass `build.ssr` into this function
    dataStrategy: getRSCSingleFetchDataStrategy(
      () => globalVar.__reactRouterDataRouter,
      true,
      payload.basename,
      createFromReadableStream,
      fetchImplementation,
    ),
  });

  // We can call initialize() immediately if the router doesn't have any
  // loaders to run on hydration
  if (globalVar.__reactRouterDataRouter.state.initialized) {
    globalVar.__routerInitialized = true;
    globalVar.__reactRouterDataRouter.initialize();
  } else {
    globalVar.__routerInitialized = false;
  }

  let lastLoaderData: unknown = undefined;
  globalVar.__reactRouterDataRouter.subscribe(({ loaderData, actionData }) => {
    if (lastLoaderData !== loaderData) {
      globalVar.__routerActionID = (globalVar.__routerActionID ??= 0) + 1;
    }
  });

  // @ts-expect-error
  globalVar.__reactRouterDataRouter._updateRoutesForHMR = (
    routeUpdateByRouteId: Map<
      string,
      {
        routeModule: any;
        hasAction: boolean;
        hasComponent: boolean;
        hasErrorBoundary: boolean;
        hasLoader: boolean;
      }
    >,
  ) => {
    const oldRoutes = (window as WindowWithRouterGlobals)
      .__reactRouterDataRouter.routes;
    const newRoutes: DataRouteObjectWithManifestInfo[] = [];

    function walkRoutes(
      routes: DataRouteObjectWithManifestInfo[],
      parentId?: string,
    ): DataRouteObjectWithManifestInfo[] {
      return routes.map((route) => {
        const routeUpdate = routeUpdateByRouteId.get(route.id);

        if (routeUpdate) {
          const {
            routeModule,
            hasAction,
            hasComponent,
            hasErrorBoundary,
            hasLoader,
          } = routeUpdate;
          const newRoute = createRouteFromServerManifest({
            clientAction: routeModule.clientAction,
            clientLoader: routeModule.clientLoader,
            element: route.element as React.ReactElement,
            errorElement: route.errorElement as React.ReactElement,
            handle: route.handle,
            hasAction,
            hasComponent,
            hasErrorBoundary,
            hasLoader,
            hydrateFallbackElement:
              route.hydrateFallbackElement as React.ReactElement,
            id: route.id,
            index: route.index,
            links: routeModule.links,
            meta: routeModule.meta,
            parentId: parentId,
            path: route.path,
            shouldRevalidate: routeModule.shouldRevalidate,
          });
          if (route.children) {
            newRoute.children = walkRoutes(route.children, route.id);
          }
          return newRoute;
        }

        const updatedRoute = { ...route };
        if (route.children) {
          updatedRoute.children = walkRoutes(route.children, route.id);
        }
        return updatedRoute;
      });
    }

    newRoutes.push(
      ...walkRoutes(oldRoutes as DataRouteObjectWithManifestInfo[], undefined),
    );

    (
      window as WindowWithRouterGlobals
    ).__reactRouterDataRouter._internalSetRoutes(newRoutes);
  };

  return {
    router: globalVar.__reactRouterDataRouter,
    routeModules: globalVar.__reactRouterRouteModules,
  };
}

const renderedRoutesContext = createContext<RSCRouteManifest[]>();

export function getRSCSingleFetchDataStrategy(
  getRouter: () => DataRouter,
  ssr: boolean,
  basename: string | undefined,
  createFromReadableStream: BrowserCreateFromReadableStreamFunction,
  fetchImplementation: (request: Request) => Promise<Response>,
): DataStrategyFunction {
  // TODO: Clean this up with a shared type
  type RSCDataRouteMatch = DataRouteMatch & {
    route: DataRouteObject & {
      hasLoader: boolean;
      hasClientLoader: boolean;
      hasComponent: boolean;
      hasAction: boolean;
      hasClientAction: boolean;
      hasShouldRevalidate: boolean;
    };
  };

  // create map
  let dataStrategy = getSingleFetchDataStrategyImpl(
    getRouter,
    (match) => {
      let M = match as RSCDataRouteMatch;
      return {
        hasLoader: M.route.hasLoader,
        hasClientLoader: M.route.hasClientLoader,
        hasComponent: M.route.hasComponent,
        hasAction: M.route.hasAction,
        hasClientAction: M.route.hasClientAction,
        hasShouldRevalidate: M.route.hasShouldRevalidate,
      };
    },
    // pass map into fetchAndDecode so it can add payloads
    getFetchAndDecodeViaRSC(createFromReadableStream, fetchImplementation),
    ssr,
    basename,
    // .rsc requests are always trailing slash aware
    true,
    // If the route has a component but we don't have an element, we need to hit
    // the server loader flow regardless of whether the client loader calls
    // `serverLoader` or not, otherwise we'll have nothing to render.
    (match) => {
      let M = match as RSCDataRouteMatch;
      return M.route.hasComponent && !M.route.element;
    },
  );
  return async (args) =>
    args.runClientMiddleware(async () => {
      // Before we run the dataStrategy, create a place to stick rendered routes
      // from the payload so we can patch them into the router after all loaders
      // have completed.  Need to do this since we may have multiple fetch
      // requests returning multiple server payloads (due to clientLoaders, fine
      // grained revalidation, etc.).  This lets us stitch them all together and
      // patch them all at the end
      // This cast should be fine since this is always run client side and
      // `context` is always of this type on the client -- unlike on the server
      // in framework mode when it could be `AppLoadContext`
      let context = args.context as RouterContextProvider;
      context.set(renderedRoutesContext, []);
      let results = await dataStrategy(args);
      // patch into router from all payloads in map
      // TODO: Confirm that it's correct for us to have multiple rendered routes
      // with the same ID. This is currently happening in `clientLoader` cases
      // where we're calling `fetchAndDecode` multiple times. This may be a
      // sign of a logical error in how we're handling client loader routes.
      const renderedRoutesById = new Map<string, RSCRouteManifest[]>();
      for (const route of context.get(renderedRoutesContext)) {
        if (!renderedRoutesById.has(route.id)) {
          renderedRoutesById.set(route.id, []);
        }
        renderedRoutesById.get(route.id)!.push(route);
      }

      React.startTransition(() => {
        for (const match of args.matches) {
          const renderedRoutes = renderedRoutesById.get(match.route.id);
          if (renderedRoutes) {
            for (const rendered of renderedRoutes) {
              (
                window as WindowWithRouterGlobals
              ).__reactRouterDataRouter.patchRoutes(
                rendered.parentId ?? null,
                [createRouteFromServerManifest(rendered)],
                true,
              );
            }
          }
        }
      });
      return results;
    });
}

function getFetchAndDecodeViaRSC(
  createFromReadableStream: BrowserCreateFromReadableStreamFunction,
  fetchImplementation: (request: Request) => Promise<Response>,
): FetchAndDecodeFunction {
  return async (
    args: DataStrategyFunctionArgs<unknown>,
    basename: string | undefined,
    trailingSlashAware: boolean,
    targetRoutes?: string[],
  ) => {
    let { request, context } = args;
    let url = singleFetchUrl(request.url, basename, trailingSlashAware, "rsc");
    if (request.method === "GET") {
      url = stripIndexParam(url);
      if (targetRoutes) {
        url.searchParams.set("_routes", targetRoutes.join(","));
      }
    }

    let res = await fetchImplementation(
      new Request(url, await createRequestInit(request)),
    );

    // If this error'd without hitting the running server, then bubble a normal
    // `ErrorResponse` and don't try to decode the body with `turbo-stream`.
    //
    // This could be triggered by a few scenarios:
    // - `.data` request 404 on a pre-rendered app using a CDN
    // - 429 error returned from a CDN on a SSR app
    if (res.status >= 400 && !res.headers.has("X-Remix-Response")) {
      throw new ErrorResponseImpl(res.status, res.statusText, await res.text());
    }

    invariant(res.body, "No response body to decode");

    try {
      const payload = (await createFromReadableStream(res.body, {
        temporaryReferences: undefined,
      })) as RSCPayload;
      if (payload.type === "redirect") {
        return {
          status: res.status,
          data: {
            redirect: {
              redirect: payload.location,
              reload: payload.reload,
              replace: payload.replace,
              revalidate: false,
              status: payload.status,
            },
          },
        };
      }

      if (payload.type !== "render") {
        throw new Error("Unexpected payload type");
      }

      // Track routes rendered per-single-fetch call so we can gather them up
      // and patch them in together at the end.  This cast should be fine since
      // this is always run client side and `context` is always of this type on
      // the client -- unlike on the server in framework mode when it could be
      // `AppLoadContext`
      (context as RouterContextProvider)
        .get(renderedRoutesContext)
        .push(...payload.matches);

      let results: DecodedSingleFetchResults = { routes: {} };
      const dataKey = isMutationMethod(request.method)
        ? "actionData"
        : "loaderData";
      for (let [routeId, data] of Object.entries(payload[dataKey] || {})) {
        results.routes[routeId] = { data };
      }
      if (payload.errors) {
        for (let [routeId, error] of Object.entries(payload.errors)) {
          results.routes[routeId] = { error };
        }
      }
      return { status: res.status, data: results };
    } catch (e) {
      // Can't clone after consuming the body via decode so we can't include the
      // body here.  In an ideal world we'd look for an RSC  content type here,
      // or even X-Remix-Response but then folks can't statically deploy their
      // prerendered .rsc files to a CDN unless they can tell that CDN to add
      // special headers to those certain files - which is a bit restrictive.
      throw new Error("Unable to decode RSC response");
    }
  };
}

/**
 * Props for the {@link unstable_RSCHydratedRouter} component.
 *
 * @name unstable_RSCHydratedRouterProps
 * @category Types
 */
export interface RSCHydratedRouterProps {
  /**
   * Your `react-server-dom-xyz/client`'s `createFromReadableStream` function,
   * used to decode payloads from the server.
   */
  createFromReadableStream: BrowserCreateFromReadableStreamFunction;
  /**
   * Optional fetch implementation. Defaults to global [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch).
   */
  fetch?: (request: Request) => Promise<Response>;
  /**
   * The decoded {@link unstable_RSCPayload} to hydrate.
   */
  payload: RSCPayload;
  /**
   * `"eager"` or `"lazy"` - Determines if links are eagerly discovered, or
   * delayed until clicked.
   */
  routeDiscovery?: "eager" | "lazy";
  /**
   * A function that returns an {@link RouterContextProvider} instance
   * which is provided as the `context` argument to client [`action`](../../start/data/route-object#action)s,
   * [`loader`](../../start/data/route-object#loader)s and [middleware](../../how-to/middleware).
   * This function is called to generate a fresh `context` instance on each
   * navigation or fetcher call.
   */
  getContext?: RouterInit["getContext"];
}

/**
 * Hydrates a server rendered {@link unstable_RSCPayload} in the browser.
 *
 * @example
 * import { startTransition, StrictMode } from "react";
 * import { hydrateRoot } from "react-dom/client";
 * import {
 *   unstable_getRSCStream as getRSCStream,
 *   unstable_RSCHydratedRouter as RSCHydratedRouter,
 * } from "react-router";
 * import type { unstable_RSCPayload as RSCPayload } from "react-router";
 *
 * createFromReadableStream(getRSCStream()).then((payload) =>
 *   startTransition(async () => {
 *     hydrateRoot(
 *       document,
 *       <StrictMode>
 *         <RSCHydratedRouter
 *           createFromReadableStream={createFromReadableStream}
 *           payload={payload}
 *         />
 *       </StrictMode>,
 *       { formState: await getFormState(payload) },
 *     );
 *   }),
 * );
 *
 * @name unstable_RSCHydratedRouter
 * @public
 * @category RSC
 * @mode data
 * @param props Props
 * @param {unstable_RSCHydratedRouterProps.createFromReadableStream} props.createFromReadableStream n/a
 * @param {unstable_RSCHydratedRouterProps.fetch} props.fetch n/a
 * @param {unstable_RSCHydratedRouterProps.getContext} props.getContext n/a
 * @param {unstable_RSCHydratedRouterProps.payload} props.payload n/a
 * @param {unstable_RSCHydratedRouterProps.routeDiscovery} props.routeDiscovery n/a
 * @returns A hydrated {@link DataRouter} that can be used to navigate and
 * render routes.
 */
export function RSCHydratedRouter({
  createFromReadableStream,
  fetch: fetchImplementation = fetch,
  payload,
  routeDiscovery = "eager",
  getContext,
}: RSCHydratedRouterProps) {
  if (payload.type !== "render") throw new Error("Invalid payload type");

  let { router, routeModules } = React.useMemo(
    () =>
      createRouterFromPayload({
        payload,
        fetchImplementation,
        getContext,
        createFromReadableStream,
      }),
    [createFromReadableStream, payload, fetchImplementation, getContext],
  );

  React.useEffect(() => {
    setIsHydrated();
  }, []);

  React.useLayoutEffect(() => {
    // If we had to run clientLoaders on hydration, we delay initialization until
    // after we've hydrated to avoid hydration issues from synchronous client loaders
    const globalVar = window as WindowWithRouterGlobals;
    if (!globalVar.__routerInitialized) {
      globalVar.__routerInitialized = true;
      globalVar.__reactRouterDataRouter.initialize();
    }
  }, []);

  let [{ routes, state }, setState] = React.useState(() => ({
    routes: cloneRoutes(router.routes),
    state: router.state,
  }));

  React.useLayoutEffect(
    () =>
      router.subscribe((newState) => {
        if (diffRoutes(router.routes, routes))
          React.startTransition(() => {
            setState({
              routes: cloneRoutes(router.routes),
              state: newState,
            });
          });
      }),
    [router.subscribe, routes, router],
  );

  const transitionEnabledRouter = React.useMemo(
    () =>
      ({
        ...router,
        state,
        routes,
      }) as typeof router,
    [router, routes, state],
  );

  React.useEffect(() => {
    if (
      routeDiscovery === "lazy" ||
      // @ts-expect-error - TS doesn't know about this yet
      window.navigator?.connection?.saveData === true
    ) {
      return;
    }

    // Register a link href for patching
    function registerElement(el: Element) {
      let path =
        el.tagName === "FORM"
          ? el.getAttribute("action")
          : el.getAttribute("href");
      if (!path) {
        return;
      }
      // optimization: use the already-parsed pathname from links
      let pathname =
        el.tagName === "A"
          ? (el as HTMLAnchorElement).pathname
          : new URL(path, window.location.origin).pathname;
      if (!discoveredPaths.has(pathname)) {
        nextPaths.add(pathname);
      }
    }

    // Register and fetch patches for all initially-rendered links/forms
    async function fetchPatches() {
      // re-check/update registered links
      document
        .querySelectorAll("a[data-discover], form[data-discover]")
        .forEach(registerElement);

      let paths = Array.from(nextPaths.keys()).filter((path) => {
        if (discoveredPaths.has(path)) {
          nextPaths.delete(path);
          return false;
        }
        return true;
      });

      if (paths.length === 0) {
        return;
      }

      try {
        await fetchAndApplyManifestPatches(
          paths,
          createFromReadableStream,
          fetchImplementation,
        );
      } catch (e) {
        console.error("Failed to fetch manifest patches", e);
      }
    }

    let debouncedFetchPatches = debounce(fetchPatches, 100);

    // scan and fetch initial links
    fetchPatches();

    let observer = new MutationObserver(() => debouncedFetchPatches());

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-discover", "href", "action"],
    });
  }, [routeDiscovery, createFromReadableStream, fetchImplementation]);

  const frameworkContext: FrameworkContextObject = {
    future: {
      // These flags have no runtime impact so can always be false.  If we add
      // flags that drive runtime behavior they'll need to be proxied through.
      v8_middleware: false,
      unstable_allowedActionOrigins: false,
      unstable_subResourceIntegrity: false,
      unstable_trailingSlashAwareDataRequests: true, // always on for RSC
    },
    isSpaMode: false,
    ssr: true,
    criticalCss: "",
    manifest: {
      routes: {},
      version: "1",
      url: "",
      entry: {
        module: "",
        imports: [],
      },
    },
    routeDiscovery: { mode: "lazy", manifestPath: "/__manifest" },
    routeModules,
  };

  return (
    <RSCRouterContext.Provider value={true}>
      <RSCRouterGlobalErrorBoundary location={state.location}>
        <FrameworkContext.Provider value={frameworkContext}>
          <RouterProvider
            router={transitionEnabledRouter}
            flushSync={ReactDOM.flushSync}
          />
        </FrameworkContext.Provider>
      </RSCRouterGlobalErrorBoundary>
    </RSCRouterContext.Provider>
  );
}

type DataRouteObjectWithManifestInfo = DataRouteObject & {
  children?: DataRouteObjectWithManifestInfo[];
  hasLoader: boolean;
  hasClientLoader: boolean;
  hasAction: boolean;
  hasClientAction: boolean;
  hasShouldRevalidate: boolean;
};

function createRouteFromServerManifest(
  match: RSCRouteManifest,
  payload?: RSCRenderPayload,
): DataRouteObjectWithManifestInfo {
  let hasInitialData = payload && match.id in payload.loaderData;
  let initialData = payload?.loaderData[match.id];
  let hasInitialError = payload?.errors && match.id in payload.errors;
  let initialError = payload?.errors?.[match.id];
  let isHydrationRequest =
    match.clientLoader?.hydrate === true ||
    !match.hasLoader ||
    // If the route has a component but we don't have an element, we need to hit
    // the server loader flow regardless of whether the client loader calls
    // `serverLoader` or not, otherwise we'll have nothing to render.
    (match.hasComponent && !match.element);

  invariant(window.__reactRouterRouteModules);
  populateRSCRouteModules(window.__reactRouterRouteModules, match);

  let dataRoute: DataRouteObjectWithManifestInfo = {
    id: match.id,
    element: match.element,
    errorElement: match.errorElement,
    handle: match.handle,
    hasErrorBoundary: match.hasErrorBoundary,
    hydrateFallbackElement: match.hydrateFallbackElement,
    index: match.index,
    loader: match.clientLoader
      ? async (args, singleFetch) => {
          try {
            let result = await match.clientLoader!({
              ...args,
              serverLoader: () => {
                preventInvalidServerHandlerCall(
                  "loader",
                  match.id,
                  match.hasLoader,
                );
                // On the first call, resolve with the server result
                if (isHydrationRequest) {
                  if (hasInitialData) {
                    return initialData;
                  }
                  if (hasInitialError) {
                    throw initialError;
                  }
                }
                return callSingleFetch(singleFetch);
              },
            });
            return result;
          } finally {
            isHydrationRequest = false;
          }
        }
      : // We always make the call in this RSC world since even if we don't
        // have a `loader` we may need to get the `element` implementation
        (_, singleFetch) => callSingleFetch(singleFetch),
    action: match.clientAction
      ? (args, singleFetch) =>
          match.clientAction!({
            ...args,
            serverAction: async () => {
              preventInvalidServerHandlerCall(
                "action",
                match.id,
                match.hasLoader,
              );
              return await callSingleFetch(singleFetch);
            },
          })
      : match.hasAction
        ? (_, singleFetch) => callSingleFetch(singleFetch)
        : () => {
            throw noActionDefinedError("action", match.id);
          },
    path: match.path,
    shouldRevalidate: match.shouldRevalidate,
    // We always have a "loader" in this RSC world since even if we don't
    // have a `loader` we may need to get the `element` implementation
    hasLoader: true,
    hasClientLoader: match.clientLoader != null,
    hasAction: match.hasAction,
    hasClientAction: match.clientAction != null,
    hasShouldRevalidate: match.shouldRevalidate != null,
  };

  if (typeof dataRoute.loader === "function") {
    dataRoute.loader.hydrate = shouldHydrateRouteLoader(
      match.id,
      match.clientLoader,
      match.hasLoader,
      false,
    );
  }

  return dataRoute;
}

function callSingleFetch(singleFetch: unknown) {
  invariant(typeof singleFetch === "function", "Invalid singleFetch parameter");
  return singleFetch();
}

function preventInvalidServerHandlerCall(
  type: "action" | "loader",
  routeId: string,
  hasHandler: boolean,
) {
  if (!hasHandler) {
    let fn = type === "action" ? "serverAction()" : "serverLoader()";
    let msg =
      `You are trying to call ${fn} on a route that does not have a server ` +
      `${type} (routeId: "${routeId}")`;
    console.error(msg);
    throw new ErrorResponseImpl(400, "Bad Request", new Error(msg), true);
  }
}

// Currently rendered links that may need prefetching
const nextPaths = new Set<string>();

// FIFO queue of previously discovered routes to prevent re-calling on
// subsequent navigations to the same path
const discoveredPathsMaxSize = 1000;
const discoveredPaths = new Set<string>();

// 7.5k to come in under the ~8k limit for most browsers
// https://stackoverflow.com/a/417184
const URL_LIMIT = 7680;

function getManifestUrl(paths: string[]): URL | null {
  if (paths.length === 0) {
    return null;
  }

  if (paths.length === 1) {
    return new URL(`${paths[0]}.manifest`, window.location.origin);
  }

  const globalVar = window as WindowWithRouterGlobals;
  let basename = (globalVar.__reactRouterDataRouter.basename ?? "").replace(
    /^\/|\/$/g,
    "",
  );
  let url = new URL(`${basename}/.manifest`, window.location.origin);
  url.searchParams.set("paths", paths.sort().join(","));

  return url;
}

async function fetchAndApplyManifestPatches(
  paths: string[],
  createFromReadableStream: BrowserCreateFromReadableStreamFunction,
  fetchImplementation: (request: Request) => Promise<Response>,
  signal?: AbortSignal,
) {
  let url = getManifestUrl(paths);
  if (url == null) {
    return;
  }

  // If the URL is nearing the ~8k limit on GET requests, skip this optimization
  // step and just let discovery happen on link click.  We also wipe out the
  // nextPaths Set here so we can start filling it with fresh links
  if (url.toString().length > URL_LIMIT) {
    nextPaths.clear();
    return;
  }

  let response = await fetchImplementation(new Request(url, { signal }));
  if (!response.body || response.status < 200 || response.status >= 300) {
    throw new Error("Unable to fetch new route matches from the server");
  }

  let payload = (await createFromReadableStream(response.body, {
    temporaryReferences: undefined,
  })) as RSCPayload;
  if (payload.type !== "manifest") {
    throw new Error("Failed to patch routes");
  }

  // Track discovered paths so we don't have to fetch them again
  paths.forEach((p) => addToFifoQueue(p, discoveredPaths));

  // Without the `allowElementMutations` flag, this will no-op if the route
  // already exists so we can just call it for all returned patches
  React.startTransition(() => {
    payload.patches.forEach((p) => {
      (window as WindowWithRouterGlobals).__reactRouterDataRouter.patchRoutes(
        p.parentId ?? null,
        [createRouteFromServerManifest(p)],
      );
    });
  });
}

function addToFifoQueue(path: string, queue: Set<string>) {
  if (queue.size >= discoveredPathsMaxSize) {
    let first = queue.values().next().value;
    if (typeof first === "string") queue.delete(first);
  }
  queue.add(path);
}

// Thanks Josh!
// https://www.joshwcomeau.com/snippets/javascript/debounce/
function debounce(callback: (...args: unknown[]) => unknown, wait: number) {
  let timeoutId: number | undefined;
  return (...args: unknown[]) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), wait);
  };
}

function isExternalLocation(location: string) {
  const newLocation = new URL(location, window.location.href);
  return newLocation.origin !== window.location.origin;
}

function cloneRoutes(
  routes: AgnosticDataRouteObject[] | undefined,
): AgnosticDataRouteObject[] {
  if (!routes) return undefined as any;
  return routes.map((route) => ({
    ...route,
    children: cloneRoutes(route.children),
  })) as any;
}

function diffRoutes(
  a: AgnosticDataRouteObject[],
  b: AgnosticDataRouteObject[],
): boolean {
  if (a.length !== b.length) return true;
  return a.some((route, index) => {
    if ((route as any).element !== (b[index] as any).element) return true;
    if ((route as any).errorElement !== (b[index] as any).errorElement)
      return true;
    if (
      (route as any).hydrateFallbackElement !==
      (b[index] as any).hydrateFallbackElement
    )
      return true;
    if ((route as any).hasErrorBoundary !== (b[index] as any).hasErrorBoundary)
      return true;
    if ((route as any).hasLoader !== (b[index] as any).hasLoader) return true;
    if ((route as any).hasClientLoader !== (b[index] as any).hasClientLoader)
      return true;
    if ((route as any).hasAction !== (b[index] as any).hasAction) return true;
    if ((route as any).hasClientAction !== (b[index] as any).hasClientAction)
      return true;
    return diffRoutes(route.children || [], b[index].children || []);
  });
}
