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
import type { ServerBuild } from "../../server-runtime/build";
import type { RouterFetch } from "./single-fetch";
import {
  getManifestPath,
  getPathsWithAncestors,
  handleClientVersionMismatch,
  isFogOfWarEnabled,
  URL_LIMIT,
} from "./fog-of-war";

/** An incremental route discovery operation. */
export type RouteDiscoveryEvent = {
  source: "eager" | "navigation" | "fetcher" | "imperative";
  version: string;
  loadAllRoutes(): Promise<void>;
  stopPropagation(): void;
};

/** A discovery response from a different build. */
export type ManifestMismatchEvent = RouteDiscoveryEvent & {
  reloadUrl: string | null;
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
  onBeforeDiscovery?: (event: RouteDiscoveryEvent) => void | Promise<void>;
  onManifestMismatch?: (event: ManifestMismatchEvent) => void | Promise<void>;
};

type Registration = { current: RouteDiscoveryOptions };
const defaultRouteDiscoveryOptions: RouteDiscoveryOptions = {
  onManifestMismatch: (event) => event.defaultBehavior(),
};
export type DiscoveryState = "partial" | "loading" | "complete";

// Owned by the hydrated router and shared by every hook and discovery source.
export class RouteDiscoveryRuntime {
  readonly enabled: boolean;
  readonly discoveredPaths = new Set<string>();
  readonly nextPaths = new Set<string>();
  state: DiscoveryState;
  ready = false;
  private registrations = new Set<Registration>();
  private defaultRegistration?: Registration;
  private listeners = new Set<() => void>();
  private fullLoad?: Promise<void>;
  private loadedManifest?: AssetsManifest;
  private mismatch?: Promise<void>;
  onError?: ClientOnErrorFunction;

  constructor(
    private getRouter: () => Router,
    readonly manifest: AssetsManifest,
    private routeModules: RouteModules,
    private ssr: boolean,
    private config: ServerBuild["routeDiscovery"],
    private isSpaMode: boolean,
    private basename?: string,
    private loadManifest: () => Promise<AssetsManifest> = async () => {
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
    },
    private fetchImplementation: RouterFetch = (request) => fetch(request),
    private serverOrigin?: string,
    private isApiOnly: boolean = false,
  ) {
    this.enabled = isFogOfWarEnabled(config, ssr);
    this.state = this.enabled && !manifest.hmr ? "partial" : "complete";
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
  register(registration: Registration, isDefault = false) {
    if (isDefault) {
      this.defaultRegistration = registration;
      return () => {
        if (this.defaultRegistration === registration) {
          this.defaultRegistration = undefined;
        }
      };
    }
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
    // Install the shared promise before notifying consumers or calling user code.
    this.fullLoad = Promise.resolve().then(async () => {
      try {
        let fullManifest = await this.loadManifest();
        invariant(
          fullManifest.version === this.manifest.version,
          "The full route manifest does not match the running client version.",
        );
        applyManifestPatches(
          fullManifest.routes,
          this.manifest,
          this.routeModules,
          this.ssr,
          this.isSpaMode,
          this.getRouter().patchRoutes,
          this.isApiOnly,
        );
        this.nextPaths.clear();
        this.update("complete");
      } catch (error) {
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
      let { location, matches } = this.getRouter().state;
      this.onError(error, {
        location,
        params: matches[0]?.params || {},
        pattern: getRoutePattern(matches),
      });
    } else {
      console.error(error);
    }
  }

  private async dispatch(
    kind: keyof RouteDiscoveryOptions,
    source: RouteDiscoveryEvent["source"],
    reloadUrl: string | null,
  ) {
    let stopped = false;
    let defaultBehavior: Promise<void> | undefined;
    // Remember only failures from the load offered to this chain. Unrelated
    // exceptions in application handlers still use normal discovery errors.
    let loadErrors = new Set<unknown>();
    let event: ManifestMismatchEvent = {
      source,
      reloadUrl,
      version: this.manifest.version,
      stopPropagation() {
        stopped = true;
      },
      loadAllRoutes: () =>
        this.loadAllRoutes().catch((error) => {
          loadErrors.add(error);
          throw error;
        }),
      defaultBehavior: () => {
        defaultBehavior ??= Promise.resolve().then(async () => {
          if (source !== "imperative" && !this.isComplete()) {
            await handleClientVersionMismatch(
              true,
              this.manifest.version,
              reloadUrl,
            );
          }
        });
        return defaultBehavior;
      },
    };
    let registrations = [...this.registrations]
      .reverse()
      .filter((registration) => registration.current[kind]);
    // Default recovery is available during initialization, before hooks mount.
    // Its priority is explicit instead of depending on React effect ordering.
    let defaultRegistration = this.defaultRegistration || {
      current: defaultRouteDiscoveryOptions,
    };
    if (registrations.length === 0) registrations.push(defaultRegistration);
    for (let registration of registrations) {
      if (
        registration !== defaultRegistration &&
        !this.registrations.has(registration)
      )
        continue;
      try {
        await registration.current[kind]?.(event);
      } catch (error) {
        if (!loadErrors.has(error)) throw error;
        // Full-load errors remain catchable by applications and never render a
        // route error boundary. Before discovery, incremental discovery can try;
        // after a mismatch the incomplete operation will instead be canceled.
        this.reportError(error);
        break;
      }
      if (stopped) break;
    }
  }

  private requestUrl(paths: string[]) {
    let params = new URLSearchParams();
    params.set("paths", paths.slice().sort().join(","));
    params.set("version", this.manifest.version);
    let url = new URL(
      getManifestPath(this.config.manifestPath, this.basename),
      this.serverOrigin ?? window.location.origin,
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
        basename: this.basename || "/",
      });
    });
    return this.discover(pathnames, "imperative", null, options.signal);
  };

  async discover(
    paths: string[],
    source: RouteDiscoveryEvent["source"],
    reloadUrl: string | null,
    signal?: AbortSignal,
    patch = this.getRouter().patchRoutes,
  ): Promise<DiscoveryResult> {
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
        await waitForDiscovery(
          this.dispatch("onBeforeDiscovery", source, reloadUrl),
          signal,
        );
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
              this.mismatch = Promise.resolve()
                .then(() =>
                  this.dispatch("onManifestMismatch", source, reloadUrl),
                )
                .finally(() => {
                  this.mismatch = undefined;
                });
            }
            await waitForDiscovery(this.mismatch, signal);
          } else {
            // Defaults recover each operation independently: an eager warning
            // must not suppress a concurrent navigation's document reload.
            await waitForDiscovery(
              this.dispatch("onManifestMismatch", source, reloadUrl),
              signal,
            );
          }
          if (signal?.aborted) return { type: "aborted" };
          return { type: this.isComplete() ? "success" : "version-mismatch" };
        }
        await handleClientVersionMismatch(
          false,
          this.manifest.version,
          reloadUrl,
        );
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
          this.manifest,
          this.routeModules,
          this.ssr,
          this.isSpaMode,
          patch,
          this.isApiOnly,
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

// Keep one committed React state value for all hook consumers. Operations and eager
// discovery still read the runtime directly, independent of render scheduling.
function useRouteDiscoveryState(runtime: RouteDiscoveryRuntime) {
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
  return state;
}

const serverLoad = () => Promise.resolve();
const serverDiscover = async (): Promise<DiscoveryResult> => ({
  type: "success",
});

/**
 * Control lazy route discovery in conventional Framework Mode with
 * `future.unstable_customRouteDiscovery` enabled. Full-manifest
 * loading downloads metadata, not route modules. Applications must retain their
 * versioned assets and maintain compatible server contracts for running clients.
 *
 * ```tsx
 * let { state, loadAllRoutes } = unstable_useRouteDiscovery({
 *   onManifestMismatch: async (event) => {
 *     await event.loadAllRoutes();
 *   },
 * });
 * ```
 *
 * See the [Route Discovery guide](../../how-to/route-discovery) for selective
 * discovery, handler composition, and recovery behavior.
 *
 * @name unstable_useRouteDiscovery
 * @public
 * @category Hooks
 * @mode framework
 * @param options Awaited discovery and version-mismatch handlers.
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
  useRouteDiscoveryHandlers(runtime, options);
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

function useRouteDiscoveryHandlers(
  runtime: RouteDiscoveryRuntime | undefined,
  options: RouteDiscoveryOptions,
  isDefault = false,
) {
  let registration = React.useRef<Registration>({ current: options });
  let hasHandlers = Boolean(
    options.onBeforeDiscovery || options.onManifestMismatch,
  );
  React.useLayoutEffect(() => {
    registration.current.current = options;
  });
  React.useLayoutEffect(() => {
    if (hasHandlers) return runtime?.register(registration.current, isDefault);
  }, [runtime, hasHandlers, isDefault]);
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
  useRouteDiscoveryHandlers(runtime, defaultRouteDiscoveryOptions, true);
  React.useLayoutEffect(() => {
    runtime.onError = onError;
  }, [runtime, onError]);
  let state = useRouteDiscoveryState(runtime);
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
