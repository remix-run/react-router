import type { StaticHandlerContext } from "../../router/router";

import type { EntryRoute } from "./routes";
import type { RouteModules } from "./routeModules";
import type { RouteManifest } from "../../router/utils";

type SerializedError = {
  message: string;
  stack?: string | undefined;
};

// Object passed to RemixContext.Provider
export interface FrameworkContextObject {
  manifest: AssetsManifest;
  routeModules: RouteModules;
  criticalCss?: string | undefined;
  serverHandoffString?: string | undefined;
  future: FutureConfig;
  isSpaMode: boolean;
  abortDelay?: number | undefined;
  serializeError?: ((error: Error) => SerializedError) | undefined;
  renderMeta?:
    | {
        didRenderScripts?: boolean | undefined;
        streamCache?:
          | Record<
              number,
              Promise<void> & {
                result?:
                  | {
                      done: boolean;
                      value: string;
                    }
                  | undefined;
                error?: unknown | undefined;
              }
            >
          | undefined;
      }
    | undefined;
}

// Additional React-Router information needed at runtime, but not hydrated
// through RemixContext
export interface EntryContext extends FrameworkContextObject {
  staticHandlerContext: StaticHandlerContext;
  serverHandoffStream?: ReadableStream<Uint8Array> | undefined;
}

export interface FutureConfig {}

export interface AssetsManifest {
  entry: {
    imports: string[];
    module: string;
  };
  routes: RouteManifest<EntryRoute>;
  url: string;
  version: string;
  hmr?:
    | {
        timestamp?: number | undefined;
        runtime: string;
      }
    | undefined;
}
