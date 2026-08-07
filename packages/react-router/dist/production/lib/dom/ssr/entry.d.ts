
import { DataRouteObject, RouteBranch, RouteManifest } from "../../router/utils.js";
import { StaticHandlerContext } from "../../router/router.js";
import { RouteModules } from "./routeModules.js";
import { EntryRoute } from "./routes.js";
import { ServerBuild } from "../../server-runtime/build.js";

//#region lib/dom/ssr/entry.d.ts
type SerializedError = {
  message: string;
  stack?: string;
};
interface FrameworkContextObject {
  manifest: AssetsManifest;
  routeModules: RouteModules;
  criticalCss?: CriticalCss;
  serverHandoffString?: string;
  future: FutureConfig;
  ssr: boolean;
  isSpaMode: boolean;
  routeDiscovery: ServerBuild["routeDiscovery"];
  nonce?: string;
  serializeError?(error: Error): SerializedError;
  renderMeta?: {
    didRenderScripts?: boolean;
    streamCache?: Record<number, Promise<void> & {
      result?: {
        done: boolean;
        value: string;
      };
      error?: unknown;
    }>;
  };
}
interface EntryContext extends FrameworkContextObject {
  branches: RouteBranch<DataRouteObject>[];
  staticHandlerContext: StaticHandlerContext;
  serverHandoffStream?: ReadableStream<Uint8Array>;
}
type FutureConfig = Record<string, never>;
type CriticalCss = string | {
  rel: "stylesheet";
  href: string;
};
interface AssetsManifest {
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
//#endregion
export { AssetsManifest, CriticalCss, EntryContext, FrameworkContextObject, FutureConfig };