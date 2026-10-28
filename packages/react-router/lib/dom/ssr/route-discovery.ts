import * as React from "react";
import { createPath, invariant } from "../../router/history";
import type { Router } from "../../router/router";
import type {
  PatchRoutesOnNavigationFunction,
  RouteManifest,
} from "../../router/utils";
import type { EntryRoute } from "./routes";
import { createClientRoutes } from "./routes";
import { DiscoveryCancelledError, prependBasename } from "../../router/utils";
import type { ClientOnErrorFunction } from "../../components";
import { getRoutePattern } from "../../router/utils";
import { useFrameworkContext } from "./components";
import type { AssetsManifest } from "./entry";
import type { RouteModules } from "./routeModules";
import type { ServerHandoff } from "../../server-runtime/serverHandoff";
import type { RouterFetch } from "./single-fetch";
import {
  getManifestPath,
  getManifestPathsParam,
  getPathsWithAncestors,
  handleClientVersionMismatch,
  isFogOfWarEnabled,
  URL_LIMIT,
} from "./fog-of-war";

/** A discovery response from a different build. */
export type ManifestMismatchEvent = {
  source: "eager" | "navigation" | "fetcher" | "imperative";
  version: string;
  reloadUrl: string | null;
  loadAllRoutes(): Promise<void>;
  stopPropagation(): void;
  /** Run built-in recovery for this source, at most once per mismatch event. */
  defaultBehavior(): Promise<void>;
};

/** The result of imperative route discovery. */
export type DiscoveryResult =
  | { type: "success" }
  | { type: "version-mismatch" }
  | { type: "aborted" };

/** Options for {@link unstable_useRouteDiscovery}. */
export type RouteDiscoveryOptions = {
  onManifestMismatch?: (event: ManifestMismatchEvent) => void | Promise<void>;
};

type Registration = { current: RouteDiscoveryOptions };
export type DiscoveryState = "partial" | "loading" | "complete";

type RouteDiscoverySsrInfo = {
  manifest: AssetsManifest;
  routeModules: RouteModules;
  router: Router | undefined;
  // Picked from `ServerHandoff` rather than `WindowReactRouterContext` so the
  // emitted types don't import `../global` and its `declare global` block
  context: Pick<
    ServerHandoff,
    | "ssr"
    | "routeDiscovery"
    | "isSpaMode"
    | "basename"
    | "unstable_apiServerOrigin"
    | "unstable_apiOnly"
  >;
};

// Owned by the hydrated router and shared by every hook and discovery source.
export class RouteDiscoveryRuntime {
  readonly enabled: boolean;
  readonly discoveredPaths = new Set<string>();
  readonly nextPaths = new Set<string>();
  state: DiscoveryState;
  ready = false;
  private registrations = new Set<Registration>();
  private listeners = new Set<() => void>();
  private fullLoadErrorListeners = new Set<(error: unknown) => void>();
  private fullLoad?: Promise<void>;
  private loadedManifest?: AssetsManifest;
  private mismatch?: {
    promise: Promise<void>;
    requests: { reloadUrl: string | null; signal?: AbortSignal }[];
  };
  private fetchImplementation: RouterFetch;
  private loadManifest: () => Promise<AssetsManifest>;
  onError?: ClientOnErrorFunction;

  constructor(
    private ssrInfo: RouteDiscoverySsrInfo,
    {
      fetch: fetchImplementation = (request) => fetch(request),
      loadManifest,
    }: {
      fetch?: RouterFetch;
      loadManifest?: () => Promise<AssetsManifest>;
    } = {},
  ) {
    this.fetchImplementation = fetchImplementation;
    this.loadManifest = loadManifest ?? (() => this.loadManifestAsset());
    let { manifest, context } = ssrInfo;
    this.enabled = isFogOfWarEnabled(context.routeDiscovery, context.ssr);
    this.state = this.enabled && !manifest.hmr ? "partial" : "complete";
  }

  private get router() {
    // The runtime is created before the router, which is assigned before any
    // discovery work starts during router initialization.
    invariant(this.ssrInfo.router, "Router unavailable for route discovery");
    return this.ssrInfo.router;
  }

  private async loadManifestAsset(): Promise<AssetsManifest> {
    let { manifest } = this.ssrInfo;
    // The existing versioned asset assigns the manifest to this global. Keep
    // the running manifest's identity (and SRI map) after reading that asset.
    if (this.loadedManifest) return this.loadedManifest;
    try {
      await import(/* @vite-ignore */ /* webpackIgnore: true */ manifest.url);
      invariant(
        window.__reactRouterManifest,
        "Unable to load the client manifest",
      );
      invariant(
        window.__reactRouterManifest !== manifest,
        "The full route manifest asset did not provide a manifest.",
      );
      // Module evaluation is cached by the browser, even if version validation
      // below rejects. Retrying must inspect this same asset, not the restored
      // partial manifest global.
      this.loadedManifest = window.__reactRouterManifest;
      return this.loadedManifest;
    } finally {
      window.__reactRouterManifest = manifest;
    }
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(state: DiscoveryState, ready = this.ready) {
    this.state = state;
    this.ready = ready;
    this.listeners.forEach((listener) => listener());
  }
  markReady = () => {
    if (!this.ready) this.update(this.state, true);
  };
  register(registration: Registration) {
    this.registrations.add(registration);
    return () => {
      this.registrations.delete(registration);
    };
  }
  private isComplete() {
    return this.state === "complete";
  }

  loadAllRoutes = (): Promise<void> => {
    if (this.isComplete()) return Promise.resolve();
    if (this.fullLoad) return this.fullLoad;
    let { manifest, routeModules, context } = this.ssrInfo;
    // Install the shared promise before notifying consumers or calling user code.
    this.fullLoad = Promise.resolve().then(async () => {
      try {
        let fullManifest = await this.loadManifest();
        invariant(
          fullManifest.version === manifest.version,
          "The full route manifest does not match the running client version.",
        );
        applyManifestPatches(
          fullManifest.routes,
          manifest,
          routeModules,
          context.ssr,
          context.isSpaMode,
          this.router.patchRoutes,
          context.unstable_apiOnly === true,
        );
        this.nextPaths.clear();
        this.update("complete");
      } catch (error) {
        this.fullLoadErrorListeners.forEach((listener) => listener(error));
        this.update("partial");
        throw error;
      } finally {
        this.fullLoad = undefined;
      }
    });
    this.update("loading");
    return this.fullLoad;
  };

  reportError(error: unknown) {
    if (this.onError) {
      let { location, matches } = this.router.state;
      this.onError(error, {
        location,
        params: matches[0]?.params || {},
        pattern: getRoutePattern(matches),
      });
    } else {
      console.error(error);
    }
  }

  private async dispatchMismatch(
    source: ManifestMismatchEvent["source"],
    reloadUrl: string | null,
    getReloadPath: () => string | null,
  ) {
    let { version } = this.ssrInfo.manifest;
    let stopped = false;
    let defaultBehavior: Promise<void> | undefined;
    let event: ManifestMismatchEvent = {
      source,
      reloadUrl,
      version,
      stopPropagation() {
        stopped = true;
      },
      loadAllRoutes: this.loadAllRoutes,
      defaultBehavior: () => {
        defaultBehavior ??= Promise.resolve().then(async () => {
          if (source !== "imperative" && !this.isComplete()) {
            await handleClientVersionMismatch(
              true,
              version,
              reloadUrl,
              undefined,
              () => (this.isComplete() ? null : getReloadPath()),
            );
          }
        });
        return defaultBehavior;
      },
    };
    let registrations = [...this.registrations]
      .reverse()
      .filter((registration) => registration.current.onManifestMismatch);
    // Default recovery does not depend on React's mount or effect ordering.
    if (registrations.length === 0) return event.defaultBehavior();

    // Track full-load failures during this chain, whether handlers use the
    // event method or the function returned by useRouteDiscovery.
    let loadErrors = new Set<unknown>();
    let onLoadError = (error: unknown) => loadErrors.add(error);
    this.fullLoadErrorListeners.add(onLoadError);
    try {
      for (let registration of registrations) {
        if (!this.registrations.has(registration)) continue;
        try {
          await registration.current.onManifestMismatch?.(event);
        } catch (error) {
          if (!loadErrors.has(error)) throw error;
          // Full-load errors remain catchable by applications and never render a
          // route error boundary. The incomplete operation will be canceled.
          this.reportError(error);
          break;
        }
        if (stopped) break;
      }
    } finally {
      this.fullLoadErrorListeners.delete(onLoadError);
    }
  }

  private requestUrl(paths: string[]) {
    let { manifest, context } = this.ssrInfo;
    let params = new URLSearchParams();
    params.set("paths", getManifestPathsParam(paths));
    params.set("version", manifest.version);
    let url = new URL(
      getManifestPath(context.routeDiscovery.manifestPath, context.basename),
      context.unstable_apiServerOrigin ?? window.location.origin,
    );
    url.search = params.toString();
    return url;
  }

  discoverRoutes = async (
    paths: string[],
    options: { signal?: AbortSignal } = {},
  ): Promise<DiscoveryResult> => {
    if (options.signal?.aborted) return { type: "aborted" };
    if (this.isComplete()) return { type: "success" };
    let pathnames = paths.map((path) => {
      invariant(
        path.startsWith("/") && !path.startsWith("//") && !path.includes("\\"),
        "discoverRoutes expects application-root paths beginning with a single '/'.",
      );
      return prependBasename({
        pathname: new URL(path, window.location.origin).pathname,
        basename: this.ssrInfo.context.basename || "/",
      });
    });
    return this.discover(pathnames, "imperative", null, options.signal);
  };

  async discover(
    paths: string[],
    source: ManifestMismatchEvent["source"],
    reloadUrl: string | null,
    signal?: AbortSignal,
    patch = this.router.patchRoutes,
  ): Promise<DiscoveryResult> {
    let { manifest, routeModules, context } = this.ssrInfo;
    if (signal?.aborted) return { type: "aborted" };
    if (this.isComplete()) return { type: "success" };
    let pending = getPathsWithAncestors(
      paths.filter((path) => !this.discoveredPaths.has(path)),
    );
    if (!pending.length) return { type: "success" };
    let batches: string[][] = [];
    if (source !== "imperative") {
      if (this.requestUrl(pending).href.length > URL_LIMIT) {
        this.nextPaths.clear();
        return { type: "success" };
      }
      batches.push(pending);
    } else {
      let batch: string[] = [];
      for (let path of pending) {
        if (this.discoveredPaths.has(path)) continue;
        if (this.requestUrl([path]).href.length > URL_LIMIT) {
          console.warn(
            `Unable to discover path exceeding the manifest request URL limit: ${path}`,
          );
          continue;
        }
        if (this.requestUrl([...batch, path]).href.length > URL_LIMIT) {
          batches.push(batch);
          batch = [];
        }
        batch.push(path);
      }
      if (batch.length) batches.push(batch);
    }
    for (let batch of batches) {
      try {
        if (signal?.aborted) return { type: "aborted" };
        if (this.isComplete()) return { type: "success" };
        let response: Response;
        try {
          response = await this.fetchImplementation(
            new Request(this.requestUrl(batch), { signal }),
            { type: "manifest" },
          );
        } catch (error) {
          if (signal?.aborted) return { type: "aborted" };
          if (this.isComplete()) return { type: "success" };
          throw error;
        }
        if (signal?.aborted) return { type: "aborted" };
        // A full load may have completed while this incremental request was in
        // flight. Its metadata is authoritative, including over mismatches.
        if (this.isComplete()) return { type: "success" };
        if (!response.ok)
          throw new Error(`${response.status} ${response.statusText}`);
        let mismatch =
          response.status === 204 &&
          response.headers.has("X-Remix-Reload-Document");
        if (mismatch) {
          if (
            this.mismatch ||
            [...this.registrations].some((r) => r.current.onManifestMismatch)
          ) {
            if (!this.mismatch) {
              let requests = [{ reloadUrl, signal }];
              let promise = Promise.resolve()
                .then(() =>
                  this.dispatchMismatch(
                    source,
                    reloadUrl,
                    () =>
                      requests.find(
                        (request) =>
                          request.reloadUrl && !request.signal?.aborted,
                      )?.reloadUrl ?? null,
                  ),
                )
                .finally(() => {
                  this.mismatch = undefined;
                });
              this.mismatch = { promise, requests };
            } else {
              this.mismatch.requests.push({ reloadUrl, signal });
            }
            await waitForDiscovery(this.mismatch.promise, signal);
          } else {
            // Defaults recover each operation independently: an eager warning
            // must not suppress a concurrent navigation's document reload.
            await waitForDiscovery(
              this.dispatchMismatch(source, reloadUrl, () =>
                signal?.aborted ? null : reloadUrl,
              ),
              signal,
            );
          }
          if (signal?.aborted) return { type: "aborted" };
          return { type: this.isComplete() ? "success" : "version-mismatch" };
        }
        await waitForDiscovery(
          handleClientVersionMismatch(
            false,
            manifest.version,
            reloadUrl,
            signal,
            () => (this.isComplete() ? null : reloadUrl),
          ),
          signal,
        );
        if (signal?.aborted) return { type: "aborted" };
        if (this.isComplete()) return { type: "success" };
        let patches: AssetsManifest["routes"];
        try {
          patches = await response.json();
        } catch (error) {
          if (signal?.aborted) return { type: "aborted" };
          if (this.isComplete()) return { type: "success" };
          throw error;
        }
        if (signal?.aborted) return { type: "aborted" };
        if (this.isComplete()) return { type: "success" };
        applyManifestPatches(
          patches,
          manifest,
          routeModules,
          context.ssr,
          context.isSpaMode,
          patch,
          context.unstable_apiOnly === true,
        );
        batch.forEach((path) => {
          if (this.discoveredPaths.size >= 1000)
            this.discoveredPaths.delete(
              this.discoveredPaths.values().next().value!,
            );
          this.discoveredPaths.add(path);
        });
      } catch (error) {
        if (signal?.aborted) return { type: "aborted" };
        if (error instanceof DiscoveryCancelledError && this.isComplete()) {
          return { type: "success" };
        }
        throw error;
      }
    }
    return { type: "success" };
  }
}

// Detach aborted operations promptly without canceling shared recovery. Keep a
// rejection handler attached even when the last waiter leaves.
function waitForDiscovery(
  promise: Promise<unknown>,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let abort = () => resolve();
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
    promise
      .then(() => resolve(), reject)
      .finally(() => signal?.removeEventListener("abort", abort));
  });
}

const serverLoad = () => Promise.resolve();
const serverDiscover = async (): Promise<DiscoveryResult> => ({
  type: "success",
});

/**
 * Control lazy route discovery in Framework Mode with `future.unstable_customRouteDiscovery`
 * enabled. This allows you to imperatively discover routes as well as add custom behavior
 * when a manifest version mismatch is detected.  Calling `loadAllRoutes` will load the entire
 * route manifest for the current (potentially stale) client version - this requires that prior
 * client artifacts are still available on your CDN _and_ you have not made breaking changes to
 * the API contracts of your loaders and actions.
 *
 * See the [Route Discovery guide](../../how-to/route-discovery) for more information and examples.
 *
 * @example
 * let { state, discoverRoutes, loadAllRoutes } = unstable_useRouteDiscovery({
 *   onManifestMismatch: async (event) => {
 *     // Eagerly load the complete route tree for this client without requiring a hard reload
 *     await event.loadAllRoutes();
 *   },
 * });
 *
 * // Eagerly discover specific routes
 * discoverRoutes(["/a", "/b"]);
 *
 * @name unstable_useRouteDiscovery
 * @public
 * @category Hooks
 * @mode framework
 * @param options An awaited manifest-mismatch handler.
 * @returns The client version, full-manifest loading state, and discovery operations.
 */
export function useRouteDiscovery(options: RouteDiscoveryOptions = {}) {
  let context = useFrameworkContext();
  invariant(
    context.future.unstable_customRouteDiscovery,
    "unstable_useRouteDiscovery requires future.unstable_customRouteDiscovery to be enabled in react-router.config.ts.",
  );
  invariant(
    context.manifest.url,
    "unstable_useRouteDiscovery is not supported in RSC mode.",
  );
  let runtime = context.routeDiscoveryRuntime;
  let registration = React.useRef<Registration>({ current: options });
  let hasHandlers = Boolean(options.onManifestMismatch);
  React.useLayoutEffect(() => {
    registration.current.current = options;
  });
  React.useLayoutEffect(() => {
    if (hasHandlers) return runtime?.register(registration.current);
  }, [runtime, hasHandlers]);
  let state: DiscoveryState =
    context.routeDiscoveryState ??
    (isFogOfWarEnabled(context.routeDiscovery, context.ssr) &&
    !context.manifest.hmr
      ? "partial"
      : "complete");
  return {
    version: context.manifest.version,
    state,
    loadAllRoutes: runtime?.loadAllRoutes || serverLoad,
    discoverRoutes: runtime?.discoverRoutes || serverDiscover,
  };
}

export function getCustomPatchRoutesOnNavigationFunction(
  getRouter: () => Router,
  runtime: RouteDiscoveryRuntime,
): PatchRoutesOnNavigationFunction | undefined {
  if (!runtime.enabled) {
    return undefined;
  }

  return async ({ path, patch, signal, fetcherKey }) => {
    let { state } = getRouter();
    let result = await runtime.discover(
      [path],
      fetcherKey != null ? "fetcher" : "navigation",
      fetcherKey != null
        ? window.location.href
        : createPath(state.navigation.location || state.location),
      signal,
      patch,
    );
    if (result.type === "version-mismatch") throw new DiscoveryCancelledError();
  };
}

export function useCustomRouteDiscovery(
  runtime: RouteDiscoveryRuntime,
  onError?: ClientOnErrorFunction,
) {
  React.useLayoutEffect(() => {
    runtime.onError = onError;
  }, [runtime, onError]);
  // Keep one committed React state value for all hook consumers. Operations and
  // eager discovery read the runtime directly, independent of render scheduling.
  let [state, setState] = React.useState(runtime.state);
  React.useLayoutEffect(() => {
    let updateState = () => {
      let nextState = runtime.state;
      // Like RouterProvider, these updates must be able to participate in
      // transitions instead of forcing already-visible content to fall back.
      React.startTransition(() => setState(nextState));
    };
    let unsubscribe = runtime.subscribe(updateState);
    // Catch updates between render and subscription, including hydration.
    updateState();
    return unsubscribe;
  }, [runtime]);
  React.useEffect(() => {
    // Don't prefetch if not enabled or if the user has `saveData` enabled
    if (
      !runtime.enabled ||
      // @ts-expect-error - TS doesn't know about this yet
      window.navigator?.connection?.saveData === true
    ) {
      return;
    }

    let { discoveredPaths, nextPaths } = runtime;

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
    let active = false;
    async function fetchPatches() {
      if (!active || runtime.state === "complete") return;
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
        await runtime.discover(lazyPaths, "eager", null);
      } catch (e) {
        runtime.reportError(e);
      }
    }

    let debouncedFetchPatches = debounce(fetchPatches, 100);

    // Setup a MutationObserver to fetch all subsequently rendered links/form
    // It just schedules a full scan since that's faster than checking subtrees
    let observer = new MutationObserver(() => debouncedFetchPatches());

    function updateDiscovery() {
      let { ready, state } = runtime;
      if (!ready || state === "complete") {
        active = false;
        observer.disconnect();
      } else if (!active) {
        active = true;
        observer.observe(document.documentElement, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ["data-discover", "href", "action"],
        });
        fetchPatches();
      }
    }
    // This subscription only controls an observer; it must not force synchronous
    // React renders when discovery changes during a concurrent navigation.
    let unsubscribe = runtime.subscribe(updateDiscovery);
    updateDiscovery();

    return () => {
      active = false;
      unsubscribe();
      observer.disconnect();
    };
  }, [runtime]);
  return state;
}

function applyManifestPatches(
  serverPatches: AssetsManifest["routes"],
  manifest: AssetsManifest,
  routeModules: RouteModules,
  ssr: boolean,
  isSpaMode: boolean,
  patchRoutes: Router["patchRoutes"],
  isApiOnly: boolean,
) {
  // Patch routes we don't know about yet into the manifest
  let knownRoutes = new Set(Object.keys(manifest.routes));
  let patches = Object.values(serverPatches).reduce((acc, route) => {
    if (route && !knownRoutes.has(route.id)) {
      acc[route.id] = route;
    }
    return acc;
  }, {} as RouteManifest<EntryRoute>);

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
  Object.assign(manifest.routes, patches);
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

export { DiscoveryCancelledError };
