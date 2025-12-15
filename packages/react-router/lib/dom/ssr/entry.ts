import type { StaticHandlerContext } from "../../router/router";

import type { EntryRoute } from "./routes";
import type { RouteModules } from "./routeModules";
import type { RouteManifest } from "../../router/utils";
import type { ServerBuild } from "../../server-runtime/build";

type SerializedError = {
  message: string;
  stack?: string;
};

// Object passed to RemixContext.Provider
export interface FrameworkContextObject {
  manifest: AssetsManifest;
  routeModules: RouteModules;
  criticalCss?: CriticalCss;
  serverHandoffString?: string;
  future: FutureConfig;
  ssr: boolean;
  isSpaMode: boolean;
  routeDiscovery: ServerBuild["routeDiscovery"];
  serializeError?(error: Error): SerializedError;
  renderMeta?: {
    didRenderScripts?: boolean;
    streamCache?: Record<
      number,
      Promise<void> & {
        result?: {
          done: boolean;
          value: string;
        };
        error?: unknown;
      }
    >;
  };
}

// Additional React-Router information needed at runtime, but not hydrated
// through RemixContext
export interface EntryContext extends FrameworkContextObject {
  staticHandlerContext: StaticHandlerContext;
  serverHandoffStream?: ReadableStream<Uint8Array>;
}

export interface FutureConfig {
  unstable_subResourceIntegrity: boolean;
  unstable_trailingSlashAwareDataRequests: boolean;
  v8_middleware: boolean;
}

export type CriticalCss = string | { rel: "stylesheet"; href: string };

export interface AssetsManifest {
  entry: {
    imports: string[];
    module: string;
  };
  routes: RouteManifest<EntryRoute>;
  url: string;
  version: string;
  hmr?: {
    timestamp?: number;
    runtime: string;
  };
  sri?: Record<string, string> | true;
}
