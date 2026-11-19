// Framework route updates run before the official plugin refreshes components.
// This runtime is only served in development.
import "/@react-refresh";

const routeUpdates = new Map();
const moduleUpdates = new Map();
const ignoredExports = new Map();
const previousIgnoredExports = window.__getReactRefreshIgnoredExports;
window.__getReactRefreshIgnoredExports = ({ id }) => [
  ...(previousIgnoredExports?.({ id }) ?? []),
  ...(ignoredExports.get(id) ?? []),
];

export function registerRoute(id, exports) {
  ignoredExports.set(id, exports);
}

let timer;
let updating;
let disposed = false;

async function updateRoutes() {
  // Serialise revalidation, and drain edits that arrive while data is loading.
  // React refresh awaits the same operation so it cannot overtake route data.
  if (updating) return updating;
  updating = (async () => {
    do {
      const manifest = JSON.parse(JSON.stringify(window.__reactRouterManifest));
      const needsRevalidation = new Set();
      for (const [id, route] of routeUpdates) {
        const imported = moduleUpdates.get(id);
        // A route edited before its first visit has metadata but no loaded
        // module. Leave it pending until navigation or its module update.
        if (!imported) continue;
        manifest.routes[id] = route;
        const previous = window.__reactRouterRouteModules[id];
        const next = { ...imported };
        for (const key of ["default", "ErrorBoundary", "HydrateFallback"]) {
          if (next[key] && previous?.[key]) next[key] = previous[key];
        }
        window.__reactRouterRouteModules[id] = next;
        if (
          route.hasLoader ||
          route.hasClientLoader ||
          route.hasClientMiddleware
        )
          needsRevalidation.add(id);
        routeUpdates.delete(id);
        moduleUpdates.delete(id);
      }
      const router = window.__reactRouterDataRouter;
      const routes = router.createRoutesForHMR(
        needsRevalidation,
        manifest.routes,
        window.__reactRouterRouteModules,
        window.__reactRouterContext.ssr,
        window.__reactRouterContext.isSpaMode,
      );
      router._internalSetRoutes(routes);
      Object.assign(window.__reactRouterManifest, manifest);
      try {
        window.__reactRouterHdrActive = true;
        await router.revalidate();
      } finally {
        window.__reactRouterHdrActive = false;
      }
    } while ([...routeUpdates.keys()].some((id) => moduleUpdates.has(id)));
  })();
  try {
    await updating;
  } finally {
    updating = undefined;
  }
}

function beforeRefresh() {
  // Upstream has no unregister API; disposed callbacks must become inert.
  if (disposed) return;
  clearTimeout(timer);
  return updateRoutes();
}

if (!window.__registerBeforePerformReactRefresh) {
  throw new Error(
    "React Router requires @vitejs/plugin-react with framework Fast Refresh support. Update your React plugin to a compatible version.",
  );
}
window.__registerBeforePerformReactRefresh(beforeRefresh);
import.meta.hot.on("react-router:hmr", ({ route }) => {
  if (route) routeUpdates.set(route.id, route);
});

export function acceptRouteUpdate(id, next, hasRefreshBoundary, invalidate) {
  moduleUpdates.set(id, next);
  // If the consumer excludes this module from React refresh, component edits
  // must propagate/reload rather than being swallowed by our own acceptance.
  if (
    !hasRefreshBoundary &&
    Object.keys(next).some(
      (key) =>
        ![
          "clientAction",
          "clientLoader",
          "clientMiddleware",
          "handle",
          "meta",
          "links",
          "shouldRevalidate",
        ].includes(key),
    )
  ) {
    invalidate("React Router route is excluded from React Fast Refresh");
    return;
  }
  // Data-only modules (including ones with no client exports) have no React
  // boundary, but still need their APIs installed and loaders revalidated.
  clearTimeout(timer);
  timer = setTimeout(
    () =>
      updateRoutes().catch((error) => {
        console.error("[react-router:hmr] Failed to update route data", error);
        invalidate("React Router could not update route data");
      }),
    16,
  );
}

import.meta.hot.dispose(() => {
  disposed = true;
  clearTimeout(timer);
  window.__getReactRefreshIgnoredExports = previousIgnoredExports;
});
