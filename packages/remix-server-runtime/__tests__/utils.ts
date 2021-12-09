import prettier from "prettier";

import type { ActionFunction, HeadersFunction, LoaderFunction } from "../";
import type { EntryRoute, ServerRoute, ServerRouteManifest } from "../routes";

export function mockServerBuild(
  routes: Record<
    string,
    {
      parentId?: string;
      index?: true;
      path?: string;
      default?: any;
      CatchBoundary?: any;
      ErrorBoundary?: any;
      action?: ActionFunction;
      headers?: HeadersFunction;
      loader?: LoaderFunction;
    }
  >
) {
  return {
    assets: {
      entry: {
        imports: [""],
        module: ""
      },
      routes: Object.entries(routes).reduce((p, [id, config]) => {
        let route: EntryRoute = {
          hasAction: !!config.action,
          hasCatchBoundary: !!config.CatchBoundary,
          hasErrorBoundary: !!config.ErrorBoundary,
          hasLoader: !!config.loader,
          id,
          module: "",
          index: config.index,
          path: config.path,
          parentId: config.parentId
        };
        return {
          ...p,
          [id]: route
        };
      }, {}),
      url: "",
      version: ""
    },
    entry: {
      module: {
        default: jest.fn(
          async (request, responseStatusCode, responseHeaders, entryContext) =>
            new Response(null, {
              status: responseStatusCode,
              headers: responseHeaders
            })
        ),
        handleDataRequest: jest.fn(async response => response)
      }
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
            CatchBoundary: config.CatchBoundary,
            ErrorBoundary: config.ErrorBoundary,
            action: config.action,
            headers: config.headers,
            loader: config.loader
          }
        };
        return {
          ...p,
          [id]: route
        };
      },
      {}
    )
  };
}

export function prettyHtml(source: string): string {
  return prettier.format(source, { parser: "html" });
}
