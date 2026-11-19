
import { PatchRoutesOnNavigationFunction, RouteObject } from "../../router/utils.js";
import { Router } from "../../router/router.js";
import { ClientOnErrorFunction } from "../../components.js";
import { RouteModules } from "./routeModules.js";
import { RouterFetch } from "./single-fetch.js";
import { ServerHandoff } from "../../server-runtime/serverHandoff.js";
import { AssetsManifest } from "./entry.js";

//#region lib/dom/ssr/route-discovery.d.ts
/** A discovery response from a different build. */
type ManifestMismatchEvent = {
  source: "eager" | "navigation" | "fetcher" | "imperative";
  version: string;
  reloadUrl: string | null;
  loadAllRoutes(): Promise<void>;
  stopPropagation(): void; /** Run built-in recovery for this source, at most once per mismatch event. */
  defaultBehavior(): Promise<void>;
};
/** The result of imperative route discovery. */
type DiscoveryResult = {
  type: "success";
} | {
  type: "version-mismatch";
} | {
  type: "aborted";
};
/** Options for {@link unstable_useRouteDiscovery}. */
type RouteDiscoveryOptions = {
  onManifestMismatch?: (event: ManifestMismatchEvent) => void | Promise<void>;
};
type Registration = {
  current: RouteDiscoveryOptions;
};
type DiscoveryState = "partial" | "loading" | "complete";
type RouteDiscoverySsrInfo = {
  manifest: AssetsManifest;
  routeModules: RouteModules;
  router: Router | undefined;
  context: Pick<ServerHandoff, "ssr" | "routeDiscovery" | "isSpaMode" | "basename" | "unstable_apiServerOrigin" | "unstable_apiOnly">;
};
declare class RouteDiscoveryRuntime {
  private ssrInfo;
  readonly enabled: boolean;
  readonly discoveredPaths: Set<string>;
  readonly nextPaths: Set<string>;
  state: DiscoveryState;
  ready: boolean;
  private registrations;
  private listeners;
  private fullLoadErrorListeners;
  private fullLoad?;
  private loadedManifest?;
  private mismatch?;
  private fetchImplementation;
  private loadManifest;
  onError?: ClientOnErrorFunction;
  constructor(ssrInfo: RouteDiscoverySsrInfo, {
    fetch: fetchImplementation,
    loadManifest
  }?: {
    fetch?: RouterFetch;
    loadManifest?: () => Promise<AssetsManifest>;
  });
  private get router();
  private loadManifestAsset;
  subscribe: (listener: () => void) => () => void;
  private update;
  markReady: () => void;
  register(registration: Registration): () => void;
  private isComplete;
  loadAllRoutes: () => Promise<void>;
  reportError(error: unknown): void;
  private dispatchMismatch;
  private requestUrl;
  discoverRoutes: (paths: string[], options?: {
    signal?: AbortSignal;
  }) => Promise<DiscoveryResult>;
  discover(paths: string[], source: ManifestMismatchEvent["source"], reloadUrl: string | null, signal?: AbortSignal, patch?: (routeId: string | null, children: RouteObject[], unstable_allowElementMutations?: boolean) => void): Promise<DiscoveryResult>;
}
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
declare function useRouteDiscovery(options?: RouteDiscoveryOptions): {
  version: string;
  state: DiscoveryState;
  loadAllRoutes: () => Promise<void>;
  discoverRoutes: (paths: string[], options?: {
    signal?: AbortSignal;
  }) => Promise<DiscoveryResult>;
};
declare function getCustomPatchRoutesOnNavigationFunction(getRouter: () => Router, runtime: RouteDiscoveryRuntime): PatchRoutesOnNavigationFunction | undefined;
declare function useCustomRouteDiscovery(runtime: RouteDiscoveryRuntime, onError?: ClientOnErrorFunction): "partial" | "loading" | "complete";
//#endregion
export { DiscoveryResult, DiscoveryState, ManifestMismatchEvent, RouteDiscoveryOptions, RouteDiscoveryRuntime, getCustomPatchRoutesOnNavigationFunction, useCustomRouteDiscovery, useRouteDiscovery };