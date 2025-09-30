import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  RouterContextProvider,
} from "../router/utils";
import type {
  AssetsManifest,
  CriticalCss,
  EntryContext,
  FutureConfig,
} from "../dom/ssr/entry";
import type { ServerRouteManifest } from "./routes";
import type { AppLoadContext } from "./data";
import type { MiddlewareEnabled } from "../types/future";
import type {
  unstable_InstrumentHandlerFunction,
  unstable_InstrumentRouteFunction,
} from "../router/instrumentation";

type OptionalCriticalCss = CriticalCss | undefined;

/**
 * The output of the compiler for the server build.
 */
export interface ServerBuild {
  entry: {
    module: ServerEntryModule;
  };
  routes: ServerRouteManifest;
  assets: AssetsManifest;
  basename?: string;
  publicPath: string;
  assetsBuildDirectory: string;
  future: FutureConfig;
  ssr: boolean;
  unstable_getCriticalCss?: (args: {
    pathname: string;
  }) => OptionalCriticalCss | Promise<OptionalCriticalCss>;
  /**
   * @deprecated This is now done via a custom header during prerendering
   */
  isSpaMode: boolean;
  prerender: string[];
  routeDiscovery: {
    mode: "lazy" | "initial";
    manifestPath: string;
  };
}

export interface HandleDocumentRequestFunction {
  (
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    context: EntryContext,
    loadContext: MiddlewareEnabled extends true
      ? RouterContextProvider
      : AppLoadContext,
  ): Promise<Response> | Response;
}

export interface HandleDataRequestFunction {
  (
    response: Response,
    args: {
      request: LoaderFunctionArgs["request"] | ActionFunctionArgs["request"];
      context: LoaderFunctionArgs["context"] | ActionFunctionArgs["context"];
      params: LoaderFunctionArgs["params"] | ActionFunctionArgs["params"];
    },
  ): Promise<Response> | Response;
}

export interface HandleErrorFunction {
  (
    error: unknown,
    args: {
      request: LoaderFunctionArgs["request"] | ActionFunctionArgs["request"];
      context: LoaderFunctionArgs["context"] | ActionFunctionArgs["context"];
      params: LoaderFunctionArgs["params"] | ActionFunctionArgs["params"];
    },
  ): void;
}

/**
 * A module that serves as the entry point for a Remix app during server
 * rendering.
 */
export interface ServerEntryModule {
  default: HandleDocumentRequestFunction;
  handleDataRequest?: HandleDataRequestFunction;
  handleError?: HandleErrorFunction;
  unstable_instrumentHandler?: unstable_InstrumentHandlerFunction;
  unstable_instrumentRoute?: unstable_InstrumentRouteFunction;
  streamTimeout?: number;
}
