import * as React from "react";
import type { PatchRoutesOnNavigationFunction } from "../../context";
import type { Router as DataRouter } from "../../router/router";
import type { RouteManifest } from "../../router/utils";
import { matchRoutes } from "../../router/utils";
import type { AssetsManifest } from "./entry";
import type { RouteModules } from "./routeModules";
import type { EntryRoute } from "./routes";
import { createClientRoutes } from "./routes";
import type { ServerBuild } from "../../server-runtime/build";

// Currently rendered links that may need prefetching
const nextPaths = new Set<string>();

// FIFO queue of previously discovered routes to prevent re-calling on
// subsequent navigations to the same path
const discoveredPathsMaxSize = 1000;
const discoveredPaths = new Set<string>();

// 7.5k to come in under the ~8k limit for most browsers
// https://stackoverflow.com/a/417184
const URL_LIMIT = 7680;

export function isFogOfWarEnabled(
  routeDiscovery: ServerBuild["routeDiscovery"],
  ssr: boolean,
) {
  return routeDiscovery.mode === "lazy" && ssr === true;
}

export function getPartialManifest(
  { sri, ...manifest }: AssetsManifest,
  router: DataRouter,
) {
  // Start with our matches for this pathname
  let routeIds = new Set(router.state.matches.map((m) => m.route.id));

  let segments = router.state.location.pathname.split("/").filter(Boolean);
  let paths: string[] = ["/"];

  // We've already matched to the last segment
  segments.pop();

  // Traverse each path for our parents and match in case they have pathless/index
  // children we need to include in the initial manifest
  while (segments.length > 0) {
    paths.push(`/${segments.join("/")}`);
    segments.pop();
  }

  paths.forEach((path) => {
    let matches = matchRoutes(router.routes, path, router.basename);
    if (matches) {
      matches.forEach((m) => routeIds.add(m.route.id));
    }
  });

  let initialRoutes = [...routeIds].reduce(
    (acc, id) => Object.assign(acc, { [id]: manifest.routes[id] }),
    {},
  );
  return {
    ...manifest,
    routes: initialRoutes,
    sri: sri ? true : undefined,
  };
}

export function getPatchRoutesOnNavigationFunction(
  manifest: AssetsManifest,
  routeModules: RouteModules,
  ssr: boolean,
  routeDiscovery: ServerBuild["routeDiscovery"],
  isSpaMode: boolean,
  basename: string | undefined,
): PatchRoutesOnNavigationFunction | undefined {
  if (!isFogOfWarEnabled(routeDiscovery, ssr)) {
    return undefined;
  }

  return async ({ path, patch, signal, fetcherKey }) => {
    if (discoveredPaths.has(path)) {
      return;
    }
    await fetchAndApplyManifestPatches(
      [path],
      fetcherKey ? window.location.href : path,
      manifest,
      routeModules,
      ssr,
      isSpaMode,
      basename,
      routeDiscovery.manifestPath,
      patch,
      signal,
    );
  };
}

export function useFogOFWarDiscovery(
  router: DataRouter,
  manifest: AssetsManifest,
  routeModules: RouteModules,
  ssr: boolean,
  routeDiscovery: ServerBuild["routeDiscovery"],
  isSpaMode: boolean,
) {
  React.useEffect(() => {
    // Don't prefetch if not enabled or if the user has `saveData` enabled
    if (
      !isFogOfWarEnabled(routeDiscovery, ssr) ||
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

      let lazyPaths = Array.from(nextPaths.keys()).filter((path) => {
        if (discoveredPaths.has(path)) {
          nextPaths.delete(path);
          return false;
        }
        return true;
      });

      if (lazyPaths.length === 0) {
        return;
      }

      try {
        await fetchAndApplyManifestPatches(
          lazyPaths,
          null,
          manifest,
          routeModules,
          ssr,
          isSpaMode,
          router.basename,
          routeDiscovery.manifestPath,
          router.patchRoutes,
        );
      } catch (e) {
        console.error("Failed to fetch manifest patches", e);
      }
    }

    let debouncedFetchPatches = debounce(fetchPatches, 100);

    // scan and fetch initial links
    fetchPatches();

    // Setup a MutationObserver to fetch all subsequently rendered links/form
    // It just schedules a full scan since that's faster than checking subtrees
    let observer = new MutationObserver(() => debouncedFetchPatches());

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-discover", "href", "action"],
    });

    return () => observer.disconnect();
  }, [ssr, isSpaMode, manifest, routeModules, router, routeDiscovery]);
}

export function getManifestPath(
  _manifestPath: string | undefined,
  basename: string | undefined,
) {
  let manifestPath = _manifestPath || "/__manifest";

  if (basename == null) {
    return manifestPath;
  }

  return `${basename}${manifestPath}`.replace(/\/+/g, "/");
}

const MANIFEST_VERSION_STORAGE_KEY = "react-router-manifest-version";

export async function fetchAndApplyManifestPatches(
  paths: string[],
  errorReloadPath: string | null,
  manifest: AssetsManifest,
  routeModules: RouteModules,
  ssr: boolean,
  isSpaMode: boolean,
  basename: string | undefined,
  manifestPath: string,
  patchRoutes: DataRouter["patchRoutes"],
  signal?: AbortSignal,
): Promise<void> {
  // NOTE: Intentionally using a standalone `URLSearchParams` instance
  // instead of mutating `url.searchParams`, which is *significantly* slower:
  // https://issues.chromium.org/issues/331406951
  // https://github.com/nodejs/node/issues/51518
  const searchParams = new URLSearchParams();
  paths.sort().forEach((path) => searchParams.append("p", path));
  searchParams.set("version", manifest.version);
  let url = new URL(
    getManifestPath(manifestPath, basename),
    window.location.origin,
  );
  url.search = searchParams.toString();

  // If the URL is nearing the ~8k limit on GET requests, skip this optimization
  // step and just let discovery happen on link click.  We also wipe out the
  // nextPaths Set here so we can start filling it with fresh links
  if (url.toString().length > URL_LIMIT) {
    nextPaths.clear();
    return;
  }

  let serverPatches: AssetsManifest["routes"];
  try {
    let res = await fetch(url, { signal });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    } else if (
      res.status === 204 &&
      res.headers.has("X-Remix-Reload-Document")
    ) {
      if (!errorReloadPath) {
        // No-op during eager route discovery so we will trigger a hard reload
        // of the destination during the next navigation instead of reloading
        // while the user is sitting on the current page.  Slightly more
        // disruptive on fetcher calls because we reload the current page, but
        // it's better than the `React.useContext` error that occurs without
        // this detection.
        console.warn(
          "Detected a manifest version mismatch during eager route discovery. " +
            "The next navigation/fetch to an undiscovered route will result in " +
            "a new document navigation to sync up with the latest manifest.",
        );
        return;
      }

      try {
        // This will hard reload the destination path on navigations, or the
        // current path on fetcher calls
        if (
          sessionStorage.getItem(MANIFEST_VERSION_STORAGE_KEY) ===
          manifest.version
        ) {
          // We've already tried fixing for this version, don' try again to
          // avoid loops - just let this navigation/fetch 404
          console.error(
            "Unable to discover routes due to manifest version mismatch.",
          );
          return;
        }

        sessionStorage.setItem(MANIFEST_VERSION_STORAGE_KEY, manifest.version);
      } catch (error) {
        // Catches when storage is blocked
        // Skip version tracking and continue with reload
      }

      window.location.href = errorReloadPath;
      console.warn("Detected manifest version mismatch, reloading...");

      // Stall here and let the browser reload and avoid triggering a flash of
      // an ErrorBoundary if we threw (same thing we do in `loadRouteModule()`)
      await new Promise(() => {
        // check out of this hook cause the DJs never gonna re[s]olve this
      });
    } else if (res.status >= 400) {
      throw new Error(await res.text());
    }

    // Reset loop-detection on a successful response
    try {
      sessionStorage.removeItem(MANIFEST_VERSION_STORAGE_KEY);
    } catch {
      // Catches when storage is blocked
      // Skip version tracking and continue with reload
    }
    serverPatches = (await res.json()) as AssetsManifest["routes"];
  } catch (e) {
    if (signal?.aborted) return;
    throw e;
  }

  // Patch routes we don't know about yet into the manifest
  let knownRoutes = new Set(Object.keys(manifest.routes));
  let patches = Object.values(serverPatches).reduce((acc, route) => {
    if (route && !knownRoutes.has(route.id)) {
      acc[route.id] = route;
    }
    return acc;
  }, {} as RouteManifest<EntryRoute>);
  Object.assign(manifest.routes, patches);

  // Track discovered paths so we don't have to fetch them again
  paths.forEach((p) => addToFifoQueue(p, discoveredPaths));

  // Identify all parentIds for which we have new children to add and patch
  // in their new children
  let parentIds = new Set<string | undefined>();
  Object.values(patches).forEach((patch) => {
    if (patch && (!patch.parentId || !patches[patch.parentId])) {
      parentIds.add(patch.parentId);
    }
  });
  parentIds.forEach((parentId) =>
    patchRoutes(
      parentId || null,
      createClientRoutes(patches, routeModules, null, ssr, isSpaMode, parentId),
    ),
  );
}

function addToFifoQueue(path: string, queue: Set<string>) {
  if (queue.size >= discoveredPathsMaxSize) {
    let first = queue.values().next().value;
    queue.delete(first);
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
