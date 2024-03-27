// adapted from https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/src/refreshUtils.js
// This file gets injected into the browser as a part of the HMR runtime

function debounce(fn, delay) {
  let handle;
  return () => {
    clearTimeout(handle);
    handle = setTimeout(fn, delay);
  };
}

/* eslint-disable no-undef */
const enqueueUpdate = debounce(async () => {
  let manifest;
  if (routeUpdates.size > 0) {
    manifest = JSON.parse(JSON.stringify(__remixManifest));

    for (let route of routeUpdates.values()) {
      manifest.routes[route.id] = route;
      let imported = window.__remixRouteModuleUpdates.get(route.id);
      if (!imported) {
        throw Error(`[remix:hmr] No module update found for route ${route.id}`);
      }
      let routeModule = {
        ...imported,
        // react-refresh takes care of updating these in-place,
        // if we don't preserve existing values we'll loose state.
        default: imported.default
          ? window.__remixRouteModules[route.id]?.default ?? imported.default
          : imported.default,
        ErrorBoundary: imported.ErrorBoundary
          ? window.__remixRouteModules[route.id]?.ErrorBoundary ??
            imported.ErrorBoundary
          : imported.ErrorBoundary,
        HydrateFallback: imported.HydrateFallback
          ? window.__remixRouteModules[route.id]?.HydrateFallback ??
            imported.HydrateFallback
          : imported.HydrateFallback,
      };
      window.__remixRouteModules[route.id] = routeModule;
    }

    let needsRevalidation = new Set(
      Array.from(routeUpdates.values())
        .filter((route) => route.hasLoader || route.hasClientLoader)
        .map((route) => route.id)
    );

    let routes = __remixRouter.createRoutesForHMR(
      needsRevalidation,
      manifest.routes,
      window.__remixRouteModules,
      window.__remixContext.future,
      window.__remixContext.isSpaMode
    );
    __remixRouter._internalSetRoutes(routes);
    routeUpdates.clear();
    window.__remixRouteModuleUpdates.clear();
  }

  await revalidate();
  if (manifest) {
    Object.assign(window.__remixManifest, manifest);
  }
  exports.performReactRefresh();
}, 16);

// Taken from https://github.com/pmmmwh/react-refresh-webpack-plugin/blob/main/lib/runtime/RefreshUtils.js#L141
// This allows to resister components not detected by SWC like styled component
function registerExportsForReactRefresh(filename, moduleExports) {
  for (let key in moduleExports) {
    if (key === "__esModule") continue;
    let exportValue = moduleExports[key];
    if (exports.isLikelyComponentType(exportValue)) {
      // 'export' is required to avoid key collision when renamed exports that
      // shadow a local component name: https://github.com/vitejs/vite-plugin-react/issues/116
      // The register function has an identity check to not register twice the same component,
      // so this is safe to not used the same key here.
      exports.register(exportValue, filename + " export " + key);
    }
  }
}

function validateRefreshBoundaryAndEnqueueUpdate(
  prevExports,
  nextExports,
  // non-component exports that are handled by the framework (e.g. `meta` and `links` for route modules)
  acceptExports = []
) {
  if (
    !predicateOnExport(
      prevExports,
      (key) => key in nextExports || acceptExports.includes(key)
    )
  ) {
    return "Could not Fast Refresh (export removed)";
  }
  if (
    !predicateOnExport(
      nextExports,
      (key) => key in prevExports || acceptExports.includes(key)
    )
  ) {
    return "Could not Fast Refresh (new export)";
  }

  let hasExports = false;
  let allExportsAreHandledOrUnchanged = predicateOnExport(
    nextExports,
    (key, value) => {
      hasExports = true;
      // Remix can handle Remix-specific exports (e.g. `meta` and `links`)
      if (acceptExports.includes(key)) return true;
      // React Fast Refresh can handle component exports
      if (exports.isLikelyComponentType(value)) return true;
      // Unchanged exports are implicitly handled
      return prevExports[key] === nextExports[key];
    }
  );
  if (hasExports && allExportsAreHandledOrUnchanged) {
    enqueueUpdate();
  } else {
    return "Could not Fast Refresh. Learn more at https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#consistent-components-exports";
  }
}

function predicateOnExport(moduleExports, predicate) {
  for (let key in moduleExports) {
    if (key === "__esModule") continue;
    let desc = Object.getOwnPropertyDescriptor(moduleExports, key);
    if (desc && desc.get) return false;
    if (!predicate(key, moduleExports[key])) return false;
  }
  return true;
}

// Hides vite-ignored dynamic import so that Vite can skip analysis if no other
// dynamic import is present (https://github.com/vitejs/vite/pull/12732)
function __hmr_import(module) {
  return import(/* @vite-ignore */ module);
}

const routeUpdates = new Map();
window.__remixRouteModuleUpdates = new Map();

async function revalidate() {
  let { promise, resolve } = channel();
  let unsub = __remixRouter.subscribe((state) => {
    if (state.revalidation === "idle") {
      unsub();
      // Ensure RouterProvider setState has flushed before re-rendering
      resolve();
    }
  });
  window.__remixRevalidation = (window.__remixRevalidation || 0) + 1;
  __remixRouter.revalidate();
  return promise;
}

function channel() {
  let resolve;
  let reject;

  let promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return { promise, resolve, reject };
}

import.meta.hot.on("remix:hmr", async ({ route }) => {
  window.__remixClearCriticalCss();

  if (route) {
    routeUpdates.set(route.id, route);
  }
});

exports.__hmr_import = __hmr_import;
exports.registerExportsForReactRefresh = registerExportsForReactRefresh;
exports.validateRefreshBoundaryAndEnqueueUpdate =
  validateRefreshBoundaryAndEnqueueUpdate;
exports.enqueueUpdate = enqueueUpdate;
