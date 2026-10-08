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
  if (routeUpdates.size > 0) {
    const routeUpdateByRouteId = new Map();
    for (const routeUpdate of routeUpdates) {
      const routeId = routeUpdate.routeId;
      const routeModule = window.__reactRouterRouteModuleUpdates.get(routeId);
      if (routeModule) {
        routeUpdateByRouteId.set(routeId, { routeModule, ...routeUpdate });
      }
    }
    routeUpdates.clear();
    __reactRouterDataRouter._updateRoutesForHMR(routeUpdateByRouteId);
  }

  try {
    window.__reactRouterHdrActive = true;
    await __reactRouterDataRouter.revalidate();
  } finally {
    window.__reactRouterHdrActive = false;
  }

  exports.performReactRefresh();
}, 16);

// Taken from https://github.com/pmmmwh/react-refresh-webpack-plugin/blob/main/lib/runtime/RefreshUtils.js#L141
// This allows to resister components not detected by SWC like styled component
function registerExportsForReactRefresh(filename, moduleExports) {
  for (const key in moduleExports) {
    if (key === "__esModule") continue;
    const exportValue = moduleExports[key];
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
  acceptExports = [],
) {
  if (
    !predicateOnExport(
      prevExports,
      (key) => key in nextExports || acceptExports.includes(key),
    )
  ) {
    return "Could not Fast Refresh (export removed)";
  }
  if (
    !predicateOnExport(
      nextExports,
      (key) => key in prevExports || acceptExports.includes(key),
    )
  ) {
    return "Could not Fast Refresh (new export)";
  }

  let hasExports = false;
  const allExportsAreHandledOrUnchanged = predicateOnExport(
    nextExports,
    (key, value) => {
      hasExports = true;
      // React Router can handle additional exports (e.g. `meta` and `links`)
      if (acceptExports.includes(key)) return true;
      // React Fast Refresh can handle component exports
      if (exports.isLikelyComponentType(value)) return true;
      // Unchanged exports are implicitly handled
      return prevExports[key] === nextExports[key];
    },
  );
  if (hasExports && allExportsAreHandledOrUnchanged) {
    enqueueUpdate();
  } else {
    return "Could not Fast Refresh. Learn more at https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#consistent-components-exports";
  }
}

function predicateOnExport(moduleExports, predicate) {
  for (const key in moduleExports) {
    if (key === "__esModule") continue;
    const desc = Object.getOwnPropertyDescriptor(moduleExports, key);
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

const routeUpdates = new Set();
window.__reactRouterRouteModuleUpdates = new Map();

import.meta.hot.on("react-router:hmr", async (routeUpdate) => {
  routeUpdates.add(routeUpdate);
  if (routeUpdate.isServerOnlyChange) {
    enqueueUpdate();
  }
});

exports.__hmr_import = __hmr_import;
exports.registerExportsForReactRefresh = registerExportsForReactRefresh;
exports.validateRefreshBoundaryAndEnqueueUpdate =
  validateRefreshBoundaryAndEnqueueUpdate;
exports.enqueueUpdate = enqueueUpdate;
