
import { PatchRoutesOnNavigationFunction, RouteObject } from "../../router/utils.js";
import { Router } from "../../router/router.js";
import { ClientOnErrorFunction } from "../../components.js";
import { RouteModules } from "./routeModules.js";
import { RouterFetch } from "./single-fetch.js";
import { AssetsManifest } from "./entry.js";
import { ServerBuild } from "../../server-runtime/build.js";

//#region lib/dom/ssr/route-discovery.d.ts
/** An incremental route discovery operation. */
type RouteDiscoveryEvent = {
  source: "eager" | "navigation" | "fetcher" | "imperative";
  version: string;
  loadAllRoutes(): Promise<void>;
  stopPropagation(): void;
};
/** A discovery response from a different build. */
type ManifestMismatchEvent = RouteDiscoveryEvent & {
  reloadUrl: string | null; /** Run built-in recovery for this source, at most once per mismatch event. */
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
  onBeforeDiscovery?: (event: RouteDiscoveryEvent) => void | Promise<void>;
  onManifestMismatch?: (event: ManifestMismatchEvent) => void | Promise<void>;
};
type Registration = {
  current: RouteDiscoveryOptions;
};
type DiscoveryState = "partial" | "loading" | "complete";
declare class RouteDiscoveryRuntime {
  private getRouter;
  readonly manifest: AssetsManifest;
  private routeModules;
  private ssr;
  private config;
  private isSpaMode;
  private basename?;
  private loadManifest;
  private fetchImplementation;
  private serverOrigin?;
  private isApiOnly;
  readonly enabled: boolean;
  readonly discoveredPaths: Set<string>;
  readonly nextPaths: Set<string>;
  state: DiscoveryState;
  ready: boolean;
  private registrations;
  private defaultRegistration?;
  private listeners;
  private fullLoad?;
  private loadedManifest?;
  private mismatch?;
  onError?: ClientOnErrorFunction;
  constructor(getRouter: () => Router, manifest: AssetsManifest, routeModules: RouteModules, ssr: boolean, config: ServerBuild["routeDiscovery"], isSpaMode: boolean, basename?: string | undefined, loadManifest?: () => Promise<AssetsManifest>, fetchImplementation?: RouterFetch, serverOrigin?: string | undefined, isApiOnly?: boolean);
  subscribe: (listener: () => void) => () => void;
  private update;
  markReady: () => void;
  register(registration: Registration, isDefault?: boolean): () => void;
  private isComplete;
  loadAllRoutes: () => Promise<void>;
  reportError(error: unknown): void;
  private dispatch;
  private requestUrl;
  discoverRoutes: (paths: string[], options?: {
    signal?: AbortSignal;
  }) => Promise<DiscoveryResult>;
  discover(paths: string[], source: RouteDiscoveryEvent["source"], reloadUrl: string | null, signal?: AbortSignal, patch?: (routeId: string | null, children: RouteObject[], unstable_allowElementMutations?: boolean) => void): Promise<DiscoveryResult>;
}
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
export { DiscoveryResult, DiscoveryState, ManifestMismatchEvent, RouteDiscoveryEvent, RouteDiscoveryOptions, RouteDiscoveryRuntime, getCustomPatchRoutesOnNavigationFunction, useCustomRouteDiscovery, useRouteDiscovery };