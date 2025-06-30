import type { FutureConfig } from "../../lib/dom/ssr/entry";
import type {
  ServerRoute,
  ServerRouteManifest,
} from "../../lib/server-runtime/routes";
import type {
  HandleDocumentRequestFunction,
  HandleErrorFunction,
  ServerBuild,
} from "../../lib/server-runtime/build";
import type { HeadersFunction } from "../../lib/dom/ssr/routeModules";
import type { EntryRoute } from "../../lib/dom/ssr/routes";
import type { ActionFunction, LoaderFunction } from "../../lib/router/utils";

export function mockServerBuild(
  routes: Record<
    string,
    {
      parentId?: string;
      index?: true;
      path?: string;
      default?: any;
      ErrorBoundary?: any;
      action?: ActionFunction;
      headers?: HeadersFunction;
      loader?: LoaderFunction;
    }
  >,
  opts: {
    future?: Partial<FutureConfig>;
    handleError?: HandleErrorFunction;
    handleDocumentRequest?: HandleDocumentRequestFunction;
  } = {}
): ServerBuild {
  return {
    ssr: true,
    future: {
      unstable_middleware: false,
      unstable_subResourceIntegrity: false,
      ...opts.future,
    },
    prerender: [],
    isSpaMode: false,
    routeDiscovery: {
      mode: "lazy",
      manifestPath: "/__manifest",
    },
    assetsBuildDirectory: "",
    publicPath: "",
    assets: {
      entry: {
        imports: [""],
        module: "",
      },
      routes: Object.entries(routes).reduce((p, [id, config]) => {
        let route: EntryRoute = {
          hasAction: !!config.action,
          hasErrorBoundary: !!config.ErrorBoundary,
          hasLoader: !!config.loader,
          hasClientAction: false,
          hasClientLoader: false,
          hasClientMiddleware: false,
          clientActionModule: undefined,
          clientLoaderModule: undefined,
          clientMiddlewareModule: undefined,
          hydrateFallbackModule: undefined,
          id,
          module: "",
          index: config.index,
          path: config.path,
          parentId: config.parentId,
        };
        return {
          ...p,
          [id]: route,
        };
      }, {}),
      url: "",
      version: "",
    },
    entry: {
      module: {
        default:
          opts.handleDocumentRequest ||
          jest.fn(
            async (request, responseStatusCode, responseHeaders) =>
              new Response(null, {
                status: responseStatusCode,
                headers: responseHeaders,
              })
          ),
        handleDataRequest: jest.fn(async (response) => response),
        handleError: opts.handleError,
      },
    },
    routes: Object.entries(routes).reduce<ServerRouteManifest>(
      (p, [id, config]) => {
        let route: Omit<ServerRoute, "children"> = {
          id,
          index: config.index,
          path: config.path,
          parentId: config.parentId,
          module: {
            default: config.default,
            ErrorBoundary: config.ErrorBoundary,
            action: config.action,
            headers: config.headers,
            loader: config.loader,
          },
        };
        return {
          ...p,
          [id]: route,
        };
      },
      {}
    ),
  };
}
