import * as React from "react";
import type { Router as DataRouter } from "../../router/router";
import type {
  PatchRoutesOnNavigationFunction,
  RouteManifest,
} from "../../router/utils";
import { DiscoveryCancelledError, joinPaths } from "../../router/utils";
import type { AssetsManifest } from "./entry";
import type { RouteModules } from "./routeModules";
import type { EntryRoute } from "./routes";
import { createClientRoutes } from "./routes";
import type { ServerBuild } from "../../server-runtime/build";
import { createPath } from "../../router/history";
import type { RouterFetch } from "./single-fetch";

// Currently rendered links that may need prefetching
const nextPaths = new Set<string>();

// FIFO queue of previously discovered routes to prevent re-calling on
// subsequent navigations to the same path
const discoveredPathsMaxSize = 1000;
const discoveredPaths = new Set<string>();

// 7.5k to come in under the ~8k limit for most browsers
// https://stackoverflow.com/a/417184
export const URL_LIMIT = 7680;

export function getPathsWithAncestors(paths: string[]): string[] {
  let result = new Set<string>();

  paths.forEach((path) => {
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    // In addition to the requested path, we need to include patches for each
    // ancestor path so that we pick up any pathless/index routes below ancestor
    // segments. So if we get a request for `/parent/child`, we need to look for
    // a match on `/parent` so that if a `parent._index` route exists we return
    // it and it's available for client side matching if the user routes back up
    // to `/parent`. This is the same thing we do on initial load in <Scripts>
    // via `getPartialManifest()`.
    for (let i = 1; i < path.length; i++) {
      if (path[i] === "/") {
        result.add(path.slice(0, i));
      }
    }
    result.add(path);
  });

  return Array.from(result);
}

export function isFogOfWarEnabled(
  routeDiscovery: ServerBuild["routeDiscovery"],
  ssr: boolean,
) {
  return routeDiscovery.mode === "lazy" && ssr;
}

const MANIFEST_MATCH_COST_LIMIT = 50_000;
const MANIFEST_MATCH_COST_SEGMENT_THRESHOLD = 10;

export function shouldUseInitialRouteDiscovery(
  pathname: string,
  matchCost = 0,
): boolean {
  let segmentCount = pathname.split("/").length - 1;
  let ancestorCount = Math.max(segmentCount - 1, 0);

  // Each ancestor is shorter than the incoming pathname. Use an upper bound on
  // their cumulative length, plus the root path, to avoid expanding every prefix.
  // Regex matching scans candidate branches. Bound its estimated metadata
  // visits for deep paths while keeping typical shallow paths lazy.
  return (
    ancestorCount * pathname.length + 1 > URL_LIMIT ||
    (segmentCount > MANIFEST_MATCH_COST_SEGMENT_THRESHOLD &&
      segmentCount * matchCost > MANIFEST_MATCH_COST_LIMIT)
  );
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
    let matches = router.match(path);
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
  getRouter: () => DataRouter,
  manifest: AssetsManifest,
  routeModules: RouteModules,
  ssr: boolean,
  routeDiscovery: ServerBuild["routeDiscovery"],
  isSpaMode: boolean,
  basename: string | undefined,
  fetchImplementation: RouterFetch = (request) => fetch(request),
  serverOrigin?: string,
  isApiOnly: boolean = false,
): PatchRoutesOnNavigationFunction | undefined {
  if (!isFogOfWarEnabled(routeDiscovery, ssr)) {
    return undefined;
  }

  return async ({ path, patch, signal, fetcherKey }) => {
    if (discoveredPaths.has(path)) {
      return;
    }
    let { state } = getRouter();
    await fetchAndApplyManifestPatches(
      [path],
      // If we're patching for a fetcher call, reload the current location
      // Otherwise prefer any ongoing navigation location
      fetcherKey
        ? window.location.href
        : createPath(state.navigation.location || state.location),
      manifest,
      routeModules,
      ssr,
      isSpaMode,
      basename,
      routeDiscovery.manifestPath,
      patch,
      signal,
      fetchImplementation,
      serverOrigin,
      isApiOnly,
      fetcherKey ? () => window.location.href : undefined,
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
  fetchImplementation: RouterFetch = (request) => fetch(request),
  serverOrigin?: string,
  isApiOnly: boolean = false,
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
          undefined,
          fetchImplementation,
          serverOrigin,
          isApiOnly,
        );
      } catch (e) {
        if (!(e instanceof DiscoveryCancelledError)) {
          console.error("Failed to fetch manifest patches", e);
        }
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
  }, [
    ssr,
    isSpaMode,
    manifest,
    routeModules,
    router,
    routeDiscovery,
    fetchImplementation,
    serverOrigin,
    isApiOnly,
  ]);
}

// Paths are comma-delimited in the `paths` search param, so any literal commas
// within a path must be encoded. The server decodes each path when matching.
export function getManifestPathsParam(paths: string[]) {
  return paths
    .slice()
    .sort()
    .map((path) => path.replace(/,/g, "%2C"))
    .join(",");
}

export function getManifestPath(
  _manifestPath: string | undefined,
  basename: string | undefined,
) {
  let manifestPath = _manifestPath || "/__manifest";
  return basename == null ? manifestPath : joinPaths([basename, manifestPath]);
}

const MANIFEST_RECOVERY_STORAGE_KEY = "react-router-manifest-recovery";
const MANIFEST_RECOVERY_WINDOW = 30_000;
const MANIFEST_RELOAD_DELAYS = [0, 1000, 2000];
const MANIFEST_RELOAD_TIMEOUT = 5000;
let pendingManifestReload:
  | {
      promise: Promise<never>;
      requests: {
        path: string;
        signal?: AbortSignal;
        getReloadPath?: () => string | null;
      }[];
    }
  | undefined;

export async function handleClientVersionMismatch(
  needsReload: boolean,
  _version: string,
  errorReloadPath: string | null,
  signal?: AbortSignal,
  getReloadPath?: () => string | null,
): Promise<boolean> {
  // A sibling request already started a document navigation. Keep this request
  // pending too, without clearing the loop guard or continuing on the stale tree.
  if (pendingManifestReload) {
    if (errorReloadPath) {
      pendingManifestReload.requests.push({
        path: errorReloadPath,
        signal,
        getReloadPath,
      });
    }
    return pendingManifestReload.promise;
  }

  if (!needsReload) {
    // Reset loop-detection on a successful response
    try {
      sessionStorage.removeItem(MANIFEST_RECOVERY_STORAGE_KEY);
    } catch {
      // Session storage unavailable
    }
    return false;
  }

  if (!errorReloadPath) {
    // No-op during eager route discovery so we will trigger a hard reload
    // of the destination during the next navigation instead of reloading
    // while the user is sitting on the current page. Slightly more
    // disruptive on fetcher calls because we reload the current page, but
    // it's better than the `React.useContext` error that occurs without
    // this detection.
    console.warn(
      "Detected a manifest version mismatch during eager route discovery. " +
        "The next navigation/fetch to an undiscovered route will result in " +
        "a new document navigation to sync up with the latest manifest.",
    );
    return true;
  }

  if (signal?.aborted) throw new DiscoveryCancelledError();

  // A document reload may land on another server running the same build. Keep
  // a bounded budget across documents AND client versions so a rolling deploy
  // cannot reset recovery by alternating between builds.
  let mismatchError = new Error(
    "Unable to discover routes due to manifest version mismatch.",
  );
  let now = Date.now();
  let recovery = { attempts: 0, expiresAt: now + MANIFEST_RECOVERY_WINDOW };
  try {
    let serialized = sessionStorage.getItem(MANIFEST_RECOVERY_STORAGE_KEY);
    let stored;
    try {
      stored = JSON.parse(serialized || "null");
    } catch {
      // Replace an invalid record so it cannot disable recovery indefinitely.
    }
    if (
      stored &&
      Number.isInteger(stored.attempts) &&
      stored.attempts >= 0 &&
      Number.isFinite(stored.expiresAt) &&
      stored.expiresAt > now &&
      stored.expiresAt <= recovery.expiresAt
    ) {
      recovery = stored;
    }
    if (recovery.attempts >= MANIFEST_RELOAD_DELAYS.length) {
      throw mismatchError;
    }
  } catch {
    // Without persistent storage we cannot bound reloads across documents.
    // Fail rather than continue on the stale tree or risk a reload loop.
    throw mismatchError;
  }

  // Share the pending promise before starting navigation so concurrent requests
  // wait for the new document rather than triggering an ErrorBoundary flash.
  let rejectReload: (error: Error) => void;
  let reloadPromise = new Promise<never>((_, reject) => {
    rejectReload = reject;
  });
  let requests = [{ path: errorReloadPath, signal, getReloadPath }];
  pendingManifestReload = { promise: reloadPromise, requests };

  let timeout: ReturnType<typeof setTimeout>;
  let failReload = (error = mismatchError) => {
    clearTimeout(timeout);
    window.removeEventListener("pageshow", onPageShow);
    pendingManifestReload = undefined;
    // Keep the budget and fail discovery instead of allowing operations to
    // resume on the stale route tree.
    rejectReload(error);
  };
  let onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      // BFCache restores pending requests as well as module state.
      failReload();
    }
  };
  window.addEventListener("pageshow", onPageShow);

  let startReload = () => {
    // Backoff gives a newer navigation time to supersede the initiating one.
    // A surviving sibling can still use the shared recovery attempt.
    let path: string | null = null;
    for (let request of requests) {
      if (request.signal?.aborted) continue;
      path = request.getReloadPath ? request.getReloadPath() : request.path;
      if (path) break;
    }
    if (!path) {
      failReload(new DiscoveryCancelledError());
      return;
    }
    // A beforeunload prompt can cancel navigation without notifying us.
    timeout = setTimeout(failReload, MANIFEST_RELOAD_TIMEOUT);
    try {
      // Charge only an actual document-navigation attempt, after cancellation
      // and full-manifest loading have had a chance to supersede recovery.
      // Persist before navigating so an unavailable store cannot cause a loop.
      sessionStorage.setItem(
        MANIFEST_RECOVERY_STORAGE_KEY,
        JSON.stringify({ ...recovery, attempts: recovery.attempts + 1 }),
      );
      if (new URL(path, window.location.href).href === window.location.href) {
        // Assigning the current URL with a hash can stay in the same document.
        window.location.reload();
      } else {
        window.location.href = path;
      }
      console.warn("Detected manifest version mismatch, reloading...");
    } catch {
      failReload();
    }
  };
  let delay = MANIFEST_RELOAD_DELAYS[recovery.attempts];
  if (delay) {
    timeout = setTimeout(startReload, delay);
  } else {
    startReload();
  }
  return reloadPromise;
}

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
  fetchImplementation: RouterFetch = (request) => fetch(request),
  serverOrigin?: string,
  isApiOnly: boolean = false,
  getReloadPath?: () => string | null,
): Promise<void> {
  paths = getPathsWithAncestors(paths);

  // NOTE: Intentionally using a standalone `URLSearchParams` instance
  // instead of mutating `url.searchParams`, which is *significantly* slower:
  // https://issues.chromium.org/issues/331406951
  // https://github.com/nodejs/node/issues/51518
  const searchParams = new URLSearchParams();
  searchParams.set("paths", getManifestPathsParam(paths));
  searchParams.set("version", manifest.version);
  let url = new URL(
    getManifestPath(manifestPath, basename),
    serverOrigin ?? window.location.origin,
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
    let request = new Request(url, { signal });
    let res = await fetchImplementation(request, { type: "manifest" });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    if (
      await handleClientVersionMismatch(
        res.status === 204 && res.headers.has("X-Remix-Reload-Document"),
        manifest.version,
        errorReloadPath,
        signal,
        getReloadPath,
      )
    ) {
      return;
    }

    serverPatches = (await res.json()) as AssetsManifest["routes"];
  } catch (e) {
    if (signal?.aborted) return;
    throw e;
  }

  // If the navigation/fetcher that triggered this discovery was aborted
  // while we were waiting on the response, bail before applying anything.
  // The router's `patch` callback no-ops on an aborted signal, so mutating
  // `manifest.routes`/`discoveredPaths` here would cache the path as
  // discovered while the route tree is never patched - permanently (for the
  // session) shadowing the real route behind any ambiguous match (e.g., a
  // catch-all) on every subsequent visit
  if (signal?.aborted) {
    return;
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
      createClientRoutes(
        patches,
        routeModules,
        null,
        ssr,
        isSpaMode,
        parentId,
        undefined,
        undefined,
        isApiOnly,
      ),
    ),
  );
}

function addToFifoQueue(path: string, queue: Set<string>) {
  if (queue.size >= discoveredPathsMaxSize) {
    let first = queue.values().next().value;
    if (first !== undefined) {
      queue.delete(first);
    }
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
