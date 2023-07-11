import type { StaticHandlerContext } from "@remix-run/router";

import type { SerializedError } from "./errors";
import type { RouteManifest, ServerRouteManifest, EntryRoute } from "./routes";
import type { RouteModules, EntryRouteModule } from "./routeModules";

export interface EntryContext {
  manifest: AssetsManifest;
  routeModules: RouteModules<EntryRouteModule>;
  serverHandoffString?: string;
  staticHandlerContext: StaticHandlerContext;
  future: FutureConfig;
  serializeError(error: Error): SerializedError;
}

type Dev = {
  port?: number;
  appServerPort?: number;
  remixRequestHandlerPath?: string;
  rebuildPollIntervalMs?: number;
};

export interface FutureConfig {
  v2_dev: boolean | Dev;
  /** @deprecated Use the `postcss` config option instead */
  unstable_postcss: boolean;
  /** @deprecated Use the `tailwind` config option instead */
  unstable_tailwind: boolean;
  v2_errorBoundary: boolean;
  v2_headers: boolean;
  v2_meta: boolean;
  v2_normalizeFormMethod: boolean;
  v2_routeConvention: boolean;
}

export interface AssetsManifest {
  entry: {
    imports: string[];
    module: string;
  };
  routes: RouteManifest<EntryRoute>;
  url: string;
  version: string;
  hmrRuntime?: string;
}

export function createEntryRouteModules(
  manifest: ServerRouteManifest
): RouteModules<EntryRouteModule> {
  return Object.keys(manifest).reduce((memo, routeId) => {
    memo[routeId] = manifest[routeId].module;
    return memo;
  }, {} as RouteModules<EntryRouteModule>);
}
