"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }/**
 * react-router v7.14.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
"use client";




var _chunk7VLQJKNGjs = require('./chunk-7VLQJKNG.js');



















var _chunkYMKMFAYZjs = require('./chunk-YMKMFAYZ.js');

// lib/dom-export/dom-router-provider.tsx
var _react = require('react'); var React = _interopRequireWildcard(_react); var React2 = _interopRequireWildcard(_react); var React3 = _interopRequireWildcard(_react);
var _reactdom = require('react-dom'); var ReactDOM = _interopRequireWildcard(_reactdom); var ReactDOM2 = _interopRequireWildcard(_reactdom);
var _reactrouter = require('react-router');
function RouterProvider2(props) {
  return /* @__PURE__ */ React.createElement(_reactrouter.RouterProvider, { flushSync: ReactDOM.flushSync, ...props });
}

// lib/dom-export/hydrated-router.tsx


















var ssrInfo = null;
var router = null;
function initSsrInfo() {
  if (!ssrInfo && window.__reactRouterContext && window.__reactRouterManifest && window.__reactRouterRouteModules) {
    if (window.__reactRouterManifest.sri === true) {
      const importMap = document.querySelector("script[rr-importmap]");
      if (_optionalChain([importMap, 'optionalAccess', _2 => _2.textContent])) {
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
    _reactrouter.UNSAFE_invariant.call(void 0, stream, "No stream found for single fetch decoding");
    ssrInfo.context.stream = void 0;
    ssrInfo.stateDecodingPromise = _reactrouter.UNSAFE_decodeViaTurboStream.call(void 0, stream, window).then((value) => {
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
  let routes = _reactrouter.UNSAFE_createClientRoutes.call(void 0, 
    ssrInfo.manifest.routes,
    ssrInfo.routeModules,
    ssrInfo.context.state,
    ssrInfo.context.ssr,
    ssrInfo.context.isSpaMode
  );
  let hydrationData = void 0;
  if (ssrInfo.context.isSpaMode) {
    let { loaderData } = ssrInfo.context.state;
    if (_optionalChain([ssrInfo, 'access', _3 => _3.manifest, 'access', _4 => _4.routes, 'access', _5 => _5.root, 'optionalAccess', _6 => _6.hasLoader]) && loaderData && "root" in loaderData) {
      hydrationData = {
        loaderData: {
          root: loaderData.root
        }
      };
    }
  } else {
    hydrationData = _reactrouter.UNSAFE_getHydrationData.call(void 0, {
      state: ssrInfo.context.state,
      routes,
      getRouteInfo: (routeId) => ({
        clientLoader: _optionalChain([ssrInfo, 'access', _7 => _7.routeModules, 'access', _8 => _8[routeId], 'optionalAccess', _9 => _9.clientLoader]),
        hasLoader: _optionalChain([ssrInfo, 'access', _10 => _10.manifest, 'access', _11 => _11.routes, 'access', _12 => _12[routeId], 'optionalAccess', _13 => _13.hasLoader]) === true,
        hasHydrateFallback: _optionalChain([ssrInfo, 'access', _14 => _14.routeModules, 'access', _15 => _15[routeId], 'optionalAccess', _16 => _16.HydrateFallback]) != null
      }),
      location: window.location,
      basename: _optionalChain([window, 'access', _17 => _17.__reactRouterContext, 'optionalAccess', _18 => _18.basename]),
      isSpaMode: ssrInfo.context.isSpaMode
    });
    if (hydrationData && hydrationData.errors) {
      hydrationData.errors = _reactrouter.UNSAFE_deserializeErrors.call(void 0, hydrationData.errors);
    }
  }
  if (window.history.state && window.history.state.masked) {
    window.history.replaceState(
      { ...window.history.state, masked: void 0 },
      ""
    );
  }
  let router2 = _reactrouter.UNSAFE_createRouter.call(void 0, {
    routes,
    history: _reactrouter.UNSAFE_createBrowserHistory.call(void 0, ),
    basename: ssrInfo.context.basename,
    getContext,
    hydrationData,
    hydrationRouteProperties: _reactrouter.UNSAFE_hydrationRouteProperties,
    unstable_instrumentations,
    mapRouteProperties: _reactrouter.UNSAFE_mapRouteProperties,
    future: {
      unstable_passThroughRequests: ssrInfo.context.future.unstable_passThroughRequests
    },
    dataStrategy: _reactrouter.UNSAFE_getTurboStreamSingleFetchDataStrategy.call(void 0, 
      () => router2,
      ssrInfo.manifest,
      ssrInfo.routeModules,
      ssrInfo.context.ssr,
      ssrInfo.context.basename,
      ssrInfo.context.future.unstable_trailingSlashAwareDataRequests
    ),
    patchRoutesOnNavigation: _reactrouter.UNSAFE_getPatchRoutesOnNavigationFunction.call(void 0, 
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
  _reactrouter.UNSAFE_createClientRoutesWithHMRRevalidationOptOut;
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
    process.env.NODE_ENV === "development" ? _optionalChain([ssrInfo, 'optionalAccess', _19 => _19.context, 'access', _20 => _20.criticalCss]) : void 0
  );
  React2.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setCriticalCss(void 0);
    }
  }, []);
  React2.useEffect(() => {
    if (process.env.NODE_ENV === "development" && criticalCss === void 0) {
      document.querySelectorAll(`[${_chunkYMKMFAYZjs.CRITICAL_CSS_DATA_ATTRIBUTE}]`).forEach((element) => element.remove());
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
  _reactrouter.UNSAFE_invariant.call(void 0, ssrInfo, "ssrInfo unavailable for HydratedRouter");
  _reactrouter.UNSAFE_useFogOFWarDiscovery.call(void 0, 
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
      _reactrouter.UNSAFE_FrameworkContext.Provider,
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
      /* @__PURE__ */ React2.createElement(_reactrouter.UNSAFE_RemixErrorBoundary, { location: location2 }, /* @__PURE__ */ React2.createElement(
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
    let actionId = globalVar.__routerActionID = (_nullishCoalesce(globalVar.__routerActionID, () => ( (globalVar.__routerActionID = 0)))) + 1;
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
                  _nullishCoalesce(_optionalChain([lastMatch, 'optionalAccess', _21 => _21.id]), () => ( null)),
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
  globalVar.__reactRouterRouteModules = _nullishCoalesce(globalVar.__reactRouterRouteModules, () => ( {}));
  _chunk7VLQJKNGjs.populateRSCRouteModules.call(void 0, globalVar.__reactRouterRouteModules, payload.matches);
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
  globalVar.__reactRouterDataRouter = _chunkYMKMFAYZjs.createRouter.call(void 0, {
    routes,
    getContext,
    basename: payload.basename,
    history: _chunkYMKMFAYZjs.createBrowserHistory.call(void 0, ),
    hydrationData: _chunk7VLQJKNGjs.getHydrationData.call(void 0, {
      state: {
        loaderData: payload.loaderData,
        actionData: payload.actionData,
        errors: payload.errors
      },
      routes,
      getRouteInfo: (routeId) => {
        let match = payload.matches.find((m) => m.id === routeId);
        _chunkYMKMFAYZjs.invariant.call(void 0, match, "Route not found in payload");
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
                window.__reactRouterDataRouter.patchRoutes(_nullishCoalesce(p.parentId, () => ( null)), [
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
      globalVar.__routerActionID = (_nullishCoalesce(globalVar.__routerActionID, () => ( (globalVar.__routerActionID = 0)))) + 1;
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
var renderedRoutesContext = _chunkYMKMFAYZjs.createContext.call(void 0, );
function getRSCSingleFetchDataStrategy(getRouter, ssr, basename, createFromReadableStream, fetchImplementation) {
  let dataStrategy = _chunkYMKMFAYZjs.getSingleFetchDataStrategyImpl.call(void 0, 
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
              _nullishCoalesce(rendered.parentId, () => ( null)),
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
    let url = _chunkYMKMFAYZjs.singleFetchUrl.call(void 0, request.url, basename, trailingSlashAware, "rsc");
    if (request.method === "GET") {
      url = _chunkYMKMFAYZjs.stripIndexParam.call(void 0, url);
      if (targetRoutes) {
        url.searchParams.set("_routes", targetRoutes.join(","));
      }
    }
    let res = await fetchImplementation(
      new Request(url, await _chunkYMKMFAYZjs.createRequestInit.call(void 0, request))
    );
    if (res.status >= 400 && !res.headers.has("X-Remix-Response")) {
      throw new (0, _chunkYMKMFAYZjs.ErrorResponseImpl)(res.status, res.statusText, await res.text());
    }
    _chunkYMKMFAYZjs.invariant.call(void 0, res.body, "No response body to decode");
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
      const dataKey = _chunkYMKMFAYZjs.isMutationMethod.call(void 0, request.method) ? "actionData" : "loaderData";
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
    _chunkYMKMFAYZjs.setIsHydrated.call(void 0, );
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
    _optionalChain([window, 'access', _22 => _22.navigator, 'optionalAccess', _23 => _23.connection, 'optionalAccess', _24 => _24.saveData]) === true) {
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
  return /* @__PURE__ */ React3.createElement(_chunkYMKMFAYZjs.RSCRouterContext.Provider, { value: true }, /* @__PURE__ */ React3.createElement(_chunk7VLQJKNGjs.RSCRouterGlobalErrorBoundary, { location: state.location }, /* @__PURE__ */ React3.createElement(_chunkYMKMFAYZjs.FrameworkContext.Provider, { value: frameworkContext }, /* @__PURE__ */ React3.createElement(
    _chunkYMKMFAYZjs.RouterProvider,
    {
      router: transitionEnabledRouter,
      flushSync: ReactDOM2.flushSync
    }
  ))));
}
function createRouteFromServerManifest(match, payload) {
  let hasInitialData = payload && match.id in payload.loaderData;
  let initialData = _optionalChain([payload, 'optionalAccess', _25 => _25.loaderData, 'access', _26 => _26[match.id]]);
  let hasInitialError = _optionalChain([payload, 'optionalAccess', _27 => _27.errors]) && match.id in payload.errors;
  let initialError = _optionalChain([payload, 'optionalAccess', _28 => _28.errors, 'optionalAccess', _29 => _29[match.id]]);
  let isHydrationRequest = _optionalChain([match, 'access', _30 => _30.clientLoader, 'optionalAccess', _31 => _31.hydrate]) === true || !match.hasLoader || // If the route has a component but we don't have an element, we need to hit
  // the server loader flow regardless of whether the client loader calls
  // `serverLoader` or not, otherwise we'll have nothing to render.
  match.hasComponent && !match.element;
  _chunkYMKMFAYZjs.invariant.call(void 0, window.__reactRouterRouteModules);
  _chunk7VLQJKNGjs.populateRSCRouteModules.call(void 0, window.__reactRouterRouteModules, match);
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
      throw _chunkYMKMFAYZjs.noActionDefinedError.call(void 0, "action", match.id);
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
    dataRoute.loader.hydrate = _chunkYMKMFAYZjs.shouldHydrateRouteLoader.call(void 0, 
      match.id,
      match.clientLoader,
      match.hasLoader,
      false
    );
  }
  return dataRoute;
}
function callSingleFetch(singleFetch) {
  _chunkYMKMFAYZjs.invariant.call(void 0, typeof singleFetch === "function", "Invalid singleFetch parameter");
  return singleFetch();
}
function preventInvalidServerHandlerCall(type, routeId, hasHandler) {
  if (!hasHandler) {
    let fn = type === "action" ? "serverAction()" : "serverLoader()";
    let msg = `You are trying to call ${fn} on a route that does not have a server ${type} (routeId: "${routeId}")`;
    console.error(msg);
    throw new (0, _chunkYMKMFAYZjs.ErrorResponseImpl)(400, "Bad Request", new Error(msg), true);
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
  let basename = (_nullishCoalesce(globalVar.__reactRouterDataRouter.basename, () => ( ""))).replace(
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
        _nullishCoalesce(p.parentId, () => ( null)),
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
    return _chunkYMKMFAYZjs.invalidProtocols.includes(new URL(location2).protocol);
  } catch (e2) {
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
      _optionalChain([streamController, 'optionalAccess', _32 => _32.close, 'call', _33 => _33()]);
    });
  } else {
    _optionalChain([streamController, 'optionalAccess', _34 => _34.close, 'call', _35 => _35()]);
  }
  return rscStream;
}






exports.HydratedRouter = HydratedRouter; exports.RouterProvider = RouterProvider2; exports.unstable_RSCHydratedRouter = RSCHydratedRouter; exports.unstable_createCallServer = createCallServer; exports.unstable_getRSCStream = getRSCStream;
