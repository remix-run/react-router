/**
 * react-router v7.14.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
"use client";
import {
  RSCRouterGlobalErrorBoundary,
  deserializeErrors,
  getHydrationData,
  populateRSCRouteModules
} from "./chunk-X5LK27NZ.mjs";
import {
  CRITICAL_CSS_DATA_ATTRIBUTE,
  ErrorResponseImpl,
  FrameworkContext,
  RSCRouterContext,
  RemixErrorBoundary,
  RouterProvider,
  createBrowserHistory,
  createClientRoutes,
  createClientRoutesWithHMRRevalidationOptOut,
  createContext,
  createRequestInit,
  createRouter,
  decodeViaTurboStream,
  getPatchRoutesOnNavigationFunction,
  getSingleFetchDataStrategyImpl,
  getTurboStreamSingleFetchDataStrategy,
  hydrationRouteProperties,
  invalidProtocols,
  invariant,
  isMutationMethod,
  mapRouteProperties,
  noActionDefinedError,
  setIsHydrated,
  shouldHydrateRouteLoader,
  singleFetchUrl,
  stripIndexParam,
  useFogOFWarDiscovery
} from "./chunk-HZQGQD2X.mjs";

// lib/dom-export/dom-router-provider.tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
function RouterProvider2(props) {
  return /* @__PURE__ */ React.createElement(RouterProvider, { flushSync: ReactDOM.flushSync, ...props });
}

// lib/dom-export/hydrated-router.tsx
import * as React2 from "react";
var ssrInfo = null;
var router = null;
function initSsrInfo() {
  if (!ssrInfo && window.__reactRouterContext && window.__reactRouterManifest && window.__reactRouterRouteModules) {
    if (window.__reactRouterManifest.sri === true) {
      const importMap = document.querySelector("script[rr-importmap]");
      if (importMap?.textContent) {
        try {
          window.__reactRouterManifest.sri = JSON.parse(
            importMap.textContent
          ).integrity;
        } catch (err) {
          console.error("Failed to parse import map", err);
        }
      }
    }
    ssrInfo = {
      context: window.__reactRouterContext,
      manifest: window.__reactRouterManifest,
      routeModules: window.__reactRouterRouteModules,
      stateDecodingPromise: void 0,
      router: void 0,
      routerInitialized: false
    };
  }
}
function createHydratedRouter({
  getContext,
  unstable_instrumentations
}) {
  initSsrInfo();
  if (!ssrInfo) {
    throw new Error(
      "You must be using the SSR features of React Router in order to skip passing a `router` prop to `<RouterProvider>`"
    );
  }
  let localSsrInfo = ssrInfo;
  if (!ssrInfo.stateDecodingPromise) {
    let stream = ssrInfo.context.stream;
    invariant(stream, "No stream found for single fetch decoding");
    ssrInfo.context.stream = void 0;
    ssrInfo.stateDecodingPromise = decodeViaTurboStream(stream, window).then((value) => {
      ssrInfo.context.state = value.value;
      localSsrInfo.stateDecodingPromise.value = true;
    }).catch((e) => {
      localSsrInfo.stateDecodingPromise.error = e;
    });
  }
  if (ssrInfo.stateDecodingPromise.error) {
    throw ssrInfo.stateDecodingPromise.error;
  }
  if (!ssrInfo.stateDecodingPromise.value) {
    throw ssrInfo.stateDecodingPromise;
  }
  let routes = createClientRoutes(
    ssrInfo.manifest.routes,
    ssrInfo.routeModules,
    ssrInfo.context.state,
    ssrInfo.context.ssr,
    ssrInfo.context.isSpaMode
  );
  let hydrationData = void 0;
  if (ssrInfo.context.isSpaMode) {
    let { loaderData } = ssrInfo.context.state;
    if (ssrInfo.manifest.routes.root?.hasLoader && loaderData && "root" in loaderData) {
      hydrationData = {
        loaderData: {
          root: loaderData.root
        }
      };
    }
  } else {
    hydrationData = getHydrationData({
      state: ssrInfo.context.state,
      routes,
      getRouteInfo: (routeId) => ({
        clientLoader: ssrInfo.routeModules[routeId]?.clientLoader,
        hasLoader: ssrInfo.manifest.routes[routeId]?.hasLoader === true,
        hasHydrateFallback: ssrInfo.routeModules[routeId]?.HydrateFallback != null
      }),
      location: window.location,
      basename: window.__reactRouterContext?.basename,
      isSpaMode: ssrInfo.context.isSpaMode
    });
    if (hydrationData && hydrationData.errors) {
      hydrationData.errors = deserializeErrors(hydrationData.errors);
    }
  }
  if (window.history.state && window.history.state.masked) {
    window.history.replaceState(
      { ...window.history.state, masked: void 0 },
      ""
    );
  }
  let router2 = createRouter({
    routes,
    history: createBrowserHistory(),
    basename: ssrInfo.context.basename,
    getContext,
    hydrationData,
    hydrationRouteProperties,
    unstable_instrumentations,
    mapRouteProperties,
    future: {
      unstable_passThroughRequests: ssrInfo.context.future.unstable_passThroughRequests
    },
    dataStrategy: getTurboStreamSingleFetchDataStrategy(
      () => router2,
      ssrInfo.manifest,
      ssrInfo.routeModules,
      ssrInfo.context.ssr,
      ssrInfo.context.basename,
      ssrInfo.context.future.unstable_trailingSlashAwareDataRequests
    ),
    patchRoutesOnNavigation: getPatchRoutesOnNavigationFunction(
      () => router2,
      ssrInfo.manifest,
      ssrInfo.routeModules,
      ssrInfo.context.ssr,
      ssrInfo.context.routeDiscovery,
      ssrInfo.context.isSpaMode,
      ssrInfo.context.basename
    )
  });
  ssrInfo.router = router2;
  if (router2.state.initialized) {
    ssrInfo.routerInitialized = true;
    router2.initialize();
  }
  router2.createRoutesForHMR = /* spacer so ts-ignore does not affect the right hand of the assignment */
  createClientRoutesWithHMRRevalidationOptOut;
  window.__reactRouterDataRouter = router2;
  return router2;
}
function HydratedRouter(props) {
  if (!router) {
    router = createHydratedRouter({
      getContext: props.getContext,
      unstable_instrumentations: props.unstable_instrumentations
    });
  }
  let [criticalCss, setCriticalCss] = React2.useState(
    process.env.NODE_ENV === "development" ? ssrInfo?.context.criticalCss : void 0
  );
  React2.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setCriticalCss(void 0);
    }
  }, []);
  React2.useEffect(() => {
    if (process.env.NODE_ENV === "development" && criticalCss === void 0) {
      document.querySelectorAll(`[${CRITICAL_CSS_DATA_ATTRIBUTE}]`).forEach((element) => element.remove());
    }
  }, [criticalCss]);
  let [location2, setLocation] = React2.useState(router.state.location);
  React2.useLayoutEffect(() => {
    if (ssrInfo && ssrInfo.router && !ssrInfo.routerInitialized) {
      ssrInfo.routerInitialized = true;
      ssrInfo.router.initialize();
    }
  }, []);
  React2.useLayoutEffect(() => {
    if (ssrInfo && ssrInfo.router) {
      return ssrInfo.router.subscribe((newState) => {
        if (newState.location !== location2) {
          setLocation(newState.location);
        }
      });
    }
  }, [location2]);
  invariant(ssrInfo, "ssrInfo unavailable for HydratedRouter");
  useFogOFWarDiscovery(
    router,
    ssrInfo.manifest,
    ssrInfo.routeModules,
    ssrInfo.context.ssr,
    ssrInfo.context.routeDiscovery,
    ssrInfo.context.isSpaMode
  );
  return (
    // This fragment is important to ensure we match the <ServerRouter> JSX
    // structure so that useId values hydrate correctly
    /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(
      FrameworkContext.Provider,
      {
        value: {
          manifest: ssrInfo.manifest,
          routeModules: ssrInfo.routeModules,
          future: ssrInfo.context.future,
          criticalCss,
          ssr: ssrInfo.context.ssr,
          isSpaMode: ssrInfo.context.isSpaMode,
          routeDiscovery: ssrInfo.context.routeDiscovery
        }
      },
      /* @__PURE__ */ React2.createElement(RemixErrorBoundary, { location: location2 }, /* @__PURE__ */ React2.createElement(
        RouterProvider2,
        {
          router,
          unstable_useTransitions: props.unstable_useTransitions,
          onError: props.onError
        }
      ))
    ), /* @__PURE__ */ React2.createElement(React2.Fragment, null))
  );
}

// lib/rsc/browser.tsx
import * as React3 from "react";
import * as ReactDOM2 from "react-dom";
var defaultManifestPath = "/__manifest";
function createCallServer({
  createFromReadableStream,
  createTemporaryReferenceSet,
  encodeReply,
  fetch: fetchImplementation = fetch
}) {
  const globalVar = window;
  let landedActionId = 0;
  return async (id, args) => {
    let actionId = globalVar.__routerActionID = (globalVar.__routerActionID ?? (globalVar.__routerActionID = 0)) + 1;
    const temporaryReferences = createTemporaryReferenceSet();
    const payloadPromise = fetchImplementation(
      new Request(location.href, {
        body: await encodeReply(args, { temporaryReferences }),
        method: "POST",
        headers: {
          Accept: "text/x-component",
          "rsc-action-id": id
        }
      })
    ).then((response) => {
      if (!response.body) {
        throw new Error("No response body");
      }
      return createFromReadableStream(response.body, {
        temporaryReferences
      });
    });
    React3.startTransition(
      () => (
        // @ts-expect-error - Needs React 19 types
        Promise.resolve(payloadPromise).then(async (payload) => {
          if (payload.type === "redirect") {
            if (payload.reload || isExternalLocation(payload.location)) {
              if (hasInvalidProtocol(payload.location)) {
                throw new Error("Invalid redirect location");
              }
              window.location.href = payload.location;
              return;
            }
            React3.startTransition(() => {
              globalVar.__reactRouterDataRouter.navigate(payload.location, {
                replace: payload.replace
              });
            });
            return;
          }
          if (payload.type !== "action") {
            throw new Error("Unexpected payload type");
          }
          const rerender = await payload.rerender;
          if (rerender && landedActionId < actionId && globalVar.__routerActionID <= actionId) {
            if (rerender.type === "redirect") {
              if (rerender.reload || isExternalLocation(rerender.location)) {
                if (hasInvalidProtocol(rerender.location)) {
                  throw new Error("Invalid redirect location");
                }
                window.location.href = rerender.location;
                return;
              }
              React3.startTransition(() => {
                globalVar.__reactRouterDataRouter.navigate(rerender.location, {
                  replace: rerender.replace
                });
              });
              return;
            }
            React3.startTransition(() => {
              let lastMatch;
              for (const match of rerender.matches) {
                globalVar.__reactRouterDataRouter.patchRoutes(
                  lastMatch?.id ?? null,
                  [createRouteFromServerManifest(match)],
                  true
                );
                lastMatch = match;
              }
              window.__reactRouterDataRouter._internalSetStateDoNotUseOrYouWillBreakYourApp(
                {
                  loaderData: Object.assign(
                    {},
                    globalVar.__reactRouterDataRouter.state.loaderData,
                    rerender.loaderData
                  ),
                  errors: rerender.errors ? Object.assign(
                    {},
                    globalVar.__reactRouterDataRouter.state.errors,
                    rerender.errors
                  ) : null
                }
              );
            });
          }
        }).catch(() => {
        })
      )
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
  payload
}) {
  const globalVar = window;
  if (globalVar.__reactRouterDataRouter && globalVar.__reactRouterRouteModules)
    return {
      router: globalVar.__reactRouterDataRouter,
      routeModules: globalVar.__reactRouterRouteModules
    };
  if (payload.type !== "render") throw new Error("Invalid payload type");
  globalVar.__reactRouterRouteModules = globalVar.__reactRouterRouteModules ?? {};
  populateRSCRouteModules(globalVar.__reactRouterRouteModules, payload.matches);
  let routes = payload.matches.reduceRight((previous, match) => {
    const route = createRouteFromServerManifest(
      match,
      payload
    );
    if (previous.length > 0) {
      route.children = previous;
    } else if (!route.index) {
      route.children = [];
    }
    return [route];
  }, []);
  let applyPatchesPromise;
  globalVar.__reactRouterDataRouter = createRouter({
    routes,
    getContext,
    basename: payload.basename,
    history: createBrowserHistory(),
    hydrationData: getHydrationData({
      state: {
        loaderData: payload.loaderData,
        actionData: payload.actionData,
        errors: payload.errors
      },
      routes,
      getRouteInfo: (routeId) => {
        let match = payload.matches.find((m) => m.id === routeId);
        invariant(match, "Route not found in payload");
        return {
          clientLoader: match.clientLoader,
          hasLoader: match.hasLoader,
          hasHydrateFallback: match.hydrateFallbackElement != null
        };
      },
      location: payload.location,
      basename: payload.basename,
      isSpaMode: false
    }),
    async patchRoutesOnNavigation({ path, signal }) {
      if (payload.routeDiscovery.mode === "initial") {
        if (!applyPatchesPromise) {
          applyPatchesPromise = (async () => {
            if (!payload.patches) return;
            let patches = await payload.patches;
            React3.startTransition(() => {
              patches.forEach((p) => {
                window.__reactRouterDataRouter.patchRoutes(p.parentId ?? null, [
                  createRouteFromServerManifest(p)
                ]);
              });
            });
          })();
        }
        await applyPatchesPromise;
        return;
      }
      if (discoveredPaths.has(path)) {
        return;
      }
      await fetchAndApplyManifestPatches(
        [path],
        createFromReadableStream,
        fetchImplementation,
        signal
      );
    },
    // FIXME: Pass `build.ssr` into this function
    dataStrategy: getRSCSingleFetchDataStrategy(
      () => globalVar.__reactRouterDataRouter,
      true,
      payload.basename,
      createFromReadableStream,
      fetchImplementation
    )
  });
  if (globalVar.__reactRouterDataRouter.state.initialized) {
    globalVar.__routerInitialized = true;
    globalVar.__reactRouterDataRouter.initialize();
  } else {
    globalVar.__routerInitialized = false;
  }
  let lastLoaderData = void 0;
  globalVar.__reactRouterDataRouter.subscribe(({ loaderData, actionData }) => {
    if (lastLoaderData !== loaderData) {
      globalVar.__routerActionID = (globalVar.__routerActionID ?? (globalVar.__routerActionID = 0)) + 1;
    }
  });
  globalVar.__reactRouterDataRouter._updateRoutesForHMR = (routeUpdateByRouteId) => {
    const oldRoutes = window.__reactRouterDataRouter.routes;
    const newRoutes = [];
    function walkRoutes(routes2, parentId) {
      return routes2.map((route) => {
        const routeUpdate = routeUpdateByRouteId.get(route.id);
        if (routeUpdate) {
          const {
            routeModule,
            hasAction,
            hasComponent,
            hasErrorBoundary,
            hasLoader
          } = routeUpdate;
          const newRoute = createRouteFromServerManifest({
            clientAction: routeModule.clientAction,
            clientLoader: routeModule.clientLoader,
            element: route.element,
            errorElement: route.errorElement,
            handle: route.handle,
            hasAction,
            hasComponent,
            hasErrorBoundary,
            hasLoader,
            hydrateFallbackElement: route.hydrateFallbackElement,
            id: route.id,
            index: route.index,
            links: routeModule.links,
            meta: routeModule.meta,
            parentId,
            path: route.path,
            shouldRevalidate: routeModule.shouldRevalidate
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
      ...walkRoutes(oldRoutes, void 0)
    );
    window.__reactRouterDataRouter._internalSetRoutes(newRoutes);
  };
  return {
    router: globalVar.__reactRouterDataRouter,
    routeModules: globalVar.__reactRouterRouteModules
  };
}
var renderedRoutesContext = createContext();
function getRSCSingleFetchDataStrategy(getRouter, ssr, basename, createFromReadableStream, fetchImplementation) {
  let dataStrategy = getSingleFetchDataStrategyImpl(
    getRouter,
    (match) => {
      let M = match;
      return {
        hasLoader: M.route.hasLoader,
        hasClientLoader: M.route.hasClientLoader,
        hasComponent: M.route.hasComponent,
        hasAction: M.route.hasAction,
        hasClientAction: M.route.hasClientAction,
        hasShouldRevalidate: M.route.hasShouldRevalidate
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
      let M = match;
      return M.route.hasComponent && !M.route.element;
    }
  );
  return async (args) => args.runClientMiddleware(async () => {
    let context = args.context;
    context.set(renderedRoutesContext, []);
    let results = await dataStrategy(args);
    const renderedRoutesById = /* @__PURE__ */ new Map();
    for (const route of context.get(renderedRoutesContext)) {
      if (!renderedRoutesById.has(route.id)) {
        renderedRoutesById.set(route.id, []);
      }
      renderedRoutesById.get(route.id).push(route);
    }
    React3.startTransition(() => {
      for (const match of args.matches) {
        const renderedRoutes = renderedRoutesById.get(match.route.id);
        if (renderedRoutes) {
          for (const rendered of renderedRoutes) {
            window.__reactRouterDataRouter.patchRoutes(
              rendered.parentId ?? null,
              [createRouteFromServerManifest(rendered)],
              true
            );
          }
        }
      }
    });
    return results;
  });
}
function getFetchAndDecodeViaRSC(createFromReadableStream, fetchImplementation) {
  return async (args, basename, trailingSlashAware, targetRoutes) => {
    let { request, context } = args;
    let url = singleFetchUrl(request.url, basename, trailingSlashAware, "rsc");
    if (request.method === "GET") {
      url = stripIndexParam(url);
      if (targetRoutes) {
        url.searchParams.set("_routes", targetRoutes.join(","));
      }
    }
    let res = await fetchImplementation(
      new Request(url, await createRequestInit(request))
    );
    if (res.status >= 400 && !res.headers.has("X-Remix-Response")) {
      throw new ErrorResponseImpl(res.status, res.statusText, await res.text());
    }
    invariant(res.body, "No response body to decode");
    try {
      const payload = await createFromReadableStream(res.body, {
        temporaryReferences: void 0
      });
      if (payload.type === "redirect") {
        return {
          status: res.status,
          data: {
            redirect: {
              redirect: payload.location,
              reload: payload.reload,
              replace: payload.replace,
              revalidate: false,
              status: payload.status
            }
          }
        };
      }
      if (payload.type !== "render") {
        throw new Error("Unexpected payload type");
      }
      context.get(renderedRoutesContext).push(...payload.matches);
      let results = { routes: {} };
      const dataKey = isMutationMethod(request.method) ? "actionData" : "loaderData";
      for (let [routeId, data] of Object.entries(payload[dataKey] || {})) {
        results.routes[routeId] = { data };
      }
      if (payload.errors) {
        for (let [routeId, error] of Object.entries(payload.errors)) {
          results.routes[routeId] = { error };
        }
      }
      return { status: res.status, data: results };
    } catch (cause) {
      throw new Error("Unable to decode RSC response", { cause });
    }
  };
}
function RSCHydratedRouter({
  createFromReadableStream,
  fetch: fetchImplementation = fetch,
  payload,
  getContext
}) {
  if (payload.type !== "render") throw new Error("Invalid payload type");
  let { routeDiscovery } = payload;
  let { router: router2, routeModules } = React3.useMemo(
    () => createRouterFromPayload({
      payload,
      fetchImplementation,
      getContext,
      createFromReadableStream
    }),
    [createFromReadableStream, payload, fetchImplementation, getContext]
  );
  React3.useEffect(() => {
    setIsHydrated();
  }, []);
  React3.useLayoutEffect(() => {
    const globalVar = window;
    if (!globalVar.__routerInitialized) {
      globalVar.__routerInitialized = true;
      globalVar.__reactRouterDataRouter.initialize();
    }
  }, []);
  let [{ routes, state }, setState] = React3.useState(() => ({
    routes: cloneRoutes(router2.routes),
    state: router2.state
  }));
  React3.useLayoutEffect(
    () => router2.subscribe((newState) => {
      if (diffRoutes(router2.routes, routes))
        React3.startTransition(() => {
          setState({
            routes: cloneRoutes(router2.routes),
            state: newState
          });
        });
    }),
    [router2.subscribe, routes, router2]
  );
  const transitionEnabledRouter = React3.useMemo(
    () => ({
      ...router2,
      state,
      routes
    }),
    [router2, routes, state]
  );
  React3.useEffect(() => {
    if (routeDiscovery.mode === "initial" || // @ts-expect-error - TS doesn't know about this yet
    window.navigator?.connection?.saveData === true) {
      return;
    }
    function registerElement(el) {
      let path = el.tagName === "FORM" ? el.getAttribute("action") : el.getAttribute("href");
      if (!path) {
        return;
      }
      let pathname = el.tagName === "A" ? el.pathname : new URL(path, window.location.origin).pathname;
      if (!discoveredPaths.has(pathname)) {
        nextPaths.add(pathname);
      }
    }
    async function fetchPatches() {
      document.querySelectorAll("a[data-discover], form[data-discover]").forEach(registerElement);
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
          fetchImplementation
        );
      } catch (e) {
        console.error("Failed to fetch manifest patches", e);
      }
    }
    let debouncedFetchPatches = debounce(fetchPatches, 100);
    fetchPatches();
    let observer = new MutationObserver(() => debouncedFetchPatches());
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-discover", "href", "action"]
    });
  }, [routeDiscovery, createFromReadableStream, fetchImplementation]);
  const frameworkContext = {
    future: {
      // These flags have no runtime impact so can always be false.  If we add
      // flags that drive runtime behavior they'll need to be proxied through.
      v8_middleware: false,
      unstable_subResourceIntegrity: false,
      unstable_trailingSlashAwareDataRequests: true,
      // always on for RSC
      unstable_passThroughRequests: true
      // always on for RSC
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
        imports: []
      }
    },
    routeDiscovery: payload.routeDiscovery.mode === "initial" ? { mode: "initial", manifestPath: defaultManifestPath } : {
      mode: "lazy",
      manifestPath: payload.routeDiscovery.manifestPath || defaultManifestPath
    },
    routeModules
  };
  return /* @__PURE__ */ React3.createElement(RSCRouterContext.Provider, { value: true }, /* @__PURE__ */ React3.createElement(RSCRouterGlobalErrorBoundary, { location: state.location }, /* @__PURE__ */ React3.createElement(FrameworkContext.Provider, { value: frameworkContext }, /* @__PURE__ */ React3.createElement(
    RouterProvider,
    {
      router: transitionEnabledRouter,
      flushSync: ReactDOM2.flushSync
    }
  ))));
}
function createRouteFromServerManifest(match, payload) {
  let hasInitialData = payload && match.id in payload.loaderData;
  let initialData = payload?.loaderData[match.id];
  let hasInitialError = payload?.errors && match.id in payload.errors;
  let initialError = payload?.errors?.[match.id];
  let isHydrationRequest = match.clientLoader?.hydrate === true || !match.hasLoader || // If the route has a component but we don't have an element, we need to hit
  // the server loader flow regardless of whether the client loader calls
  // `serverLoader` or not, otherwise we'll have nothing to render.
  match.hasComponent && !match.element;
  invariant(window.__reactRouterRouteModules);
  populateRSCRouteModules(window.__reactRouterRouteModules, match);
  let dataRoute = {
    id: match.id,
    element: match.element,
    errorElement: match.errorElement,
    handle: match.handle,
    hasErrorBoundary: match.hasErrorBoundary,
    hydrateFallbackElement: match.hydrateFallbackElement,
    index: match.index,
    loader: match.clientLoader ? async (args, singleFetch) => {
      try {
        let result = await match.clientLoader({
          ...args,
          serverLoader: () => {
            preventInvalidServerHandlerCall(
              "loader",
              match.id,
              match.hasLoader
            );
            if (isHydrationRequest) {
              if (hasInitialData) {
                return initialData;
              }
              if (hasInitialError) {
                throw initialError;
              }
            }
            return callSingleFetch(singleFetch);
          }
        });
        return result;
      } finally {
        isHydrationRequest = false;
      }
    } : (
      // We always make the call in this RSC world since even if we don't
      // have a `loader` we may need to get the `element` implementation
      (_, singleFetch) => callSingleFetch(singleFetch)
    ),
    action: match.clientAction ? (args, singleFetch) => match.clientAction({
      ...args,
      serverAction: async () => {
        preventInvalidServerHandlerCall(
          "action",
          match.id,
          match.hasLoader
        );
        return await callSingleFetch(singleFetch);
      }
    }) : match.hasAction ? (_, singleFetch) => callSingleFetch(singleFetch) : () => {
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
    hasShouldRevalidate: match.shouldRevalidate != null
  };
  if (typeof dataRoute.loader === "function") {
    dataRoute.loader.hydrate = shouldHydrateRouteLoader(
      match.id,
      match.clientLoader,
      match.hasLoader,
      false
    );
  }
  return dataRoute;
}
function callSingleFetch(singleFetch) {
  invariant(typeof singleFetch === "function", "Invalid singleFetch parameter");
  return singleFetch();
}
function preventInvalidServerHandlerCall(type, routeId, hasHandler) {
  if (!hasHandler) {
    let fn = type === "action" ? "serverAction()" : "serverLoader()";
    let msg = `You are trying to call ${fn} on a route that does not have a server ${type} (routeId: "${routeId}")`;
    console.error(msg);
    throw new ErrorResponseImpl(400, "Bad Request", new Error(msg), true);
  }
}
var nextPaths = /* @__PURE__ */ new Set();
var discoveredPathsMaxSize = 1e3;
var discoveredPaths = /* @__PURE__ */ new Set();
var URL_LIMIT = 7680;
function getManifestUrl(paths) {
  if (paths.length === 0) {
    return null;
  }
  if (paths.length === 1) {
    return new URL(`${paths[0]}.manifest`, window.location.origin);
  }
  const globalVar = window;
  let basename = (globalVar.__reactRouterDataRouter.basename ?? "").replace(
    /^\/|\/$/g,
    ""
  );
  let url = new URL(`${basename}/.manifest`, window.location.origin);
  url.searchParams.set("paths", paths.sort().join(","));
  return url;
}
async function fetchAndApplyManifestPatches(paths, createFromReadableStream, fetchImplementation, signal) {
  let url = getManifestUrl(paths);
  if (url == null) {
    return;
  }
  if (url.toString().length > URL_LIMIT) {
    nextPaths.clear();
    return;
  }
  let response = await fetchImplementation(new Request(url, { signal }));
  if (!response.body || response.status < 200 || response.status >= 300) {
    throw new Error("Unable to fetch new route matches from the server");
  }
  let payload = await createFromReadableStream(response.body, {
    temporaryReferences: void 0
  });
  if (payload.type !== "manifest") {
    throw new Error("Failed to patch routes");
  }
  paths.forEach((p) => addToFifoQueue(p, discoveredPaths));
  let patches = await payload.patches;
  React3.startTransition(() => {
    patches.forEach((p) => {
      window.__reactRouterDataRouter.patchRoutes(
        p.parentId ?? null,
        [createRouteFromServerManifest(p)]
      );
    });
  });
}
function addToFifoQueue(path, queue) {
  if (queue.size >= discoveredPathsMaxSize) {
    let first = queue.values().next().value;
    if (typeof first === "string") queue.delete(first);
  }
  queue.add(path);
}
function debounce(callback, wait) {
  let timeoutId;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), wait);
  };
}
function isExternalLocation(location2) {
  const newLocation = new URL(location2, window.location.href);
  return newLocation.origin !== window.location.origin;
}
function hasInvalidProtocol(location2) {
  try {
    return invalidProtocols.includes(new URL(location2).protocol);
  } catch {
    return false;
  }
}
function cloneRoutes(routes) {
  if (!routes) return void 0;
  return routes.map((route) => ({
    ...route,
    children: cloneRoutes(route.children)
  }));
}
function diffRoutes(a, b) {
  if (a.length !== b.length) return true;
  return a.some((route, index) => {
    if (route.element !== b[index].element) return true;
    if (route.errorElement !== b[index].errorElement)
      return true;
    if (route.hydrateFallbackElement !== b[index].hydrateFallbackElement)
      return true;
    if (route.hasErrorBoundary !== b[index].hasErrorBoundary)
      return true;
    if (route.hasLoader !== b[index].hasLoader) return true;
    if (route.hasClientLoader !== b[index].hasClientLoader)
      return true;
    if (route.hasAction !== b[index].hasAction) return true;
    if (route.hasClientAction !== b[index].hasClientAction)
      return true;
    return diffRoutes(route.children || [], b[index].children || []);
  });
}

// lib/rsc/html-stream/browser.ts
function getRSCStream() {
  let encoder = new TextEncoder();
  let streamController = null;
  let rscStream = new ReadableStream({
    start(controller) {
      if (typeof window === "undefined") {
        return;
      }
      let handleChunk = (chunk) => {
        if (typeof chunk === "string") {
          controller.enqueue(encoder.encode(chunk));
        } else {
          controller.enqueue(chunk);
        }
      };
      window.__FLIGHT_DATA || (window.__FLIGHT_DATA = []);
      window.__FLIGHT_DATA.forEach(handleChunk);
      window.__FLIGHT_DATA.push = (chunk) => {
        handleChunk(chunk);
        return 0;
      };
      streamController = controller;
    }
  });
  if (typeof document !== "undefined" && document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      streamController?.close();
    });
  } else {
    streamController?.close();
  }
  return rscStream;
}
export {
  HydratedRouter,
  RouterProvider2 as RouterProvider,
  RSCHydratedRouter as unstable_RSCHydratedRouter,
  createCallServer as unstable_createCallServer,
  getRSCStream as unstable_getRSCStream
};
