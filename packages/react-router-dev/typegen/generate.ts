import dedent from "dedent";
import * as Pathe from "pathe/utils";

import { type RouteManifest, type RouteManifestEntry } from "../config/routes";

export function generate(
  routes: RouteManifest,
  route: RouteManifestEntry
): string {
  return dedent`
    // React Router generated types for route:
    // ${route.file}

    import * as T from "react-router/types"

    export type Params = {${formatParamProperties(routes, route)}}

    type RouteModule = typeof import("./${Pathe.filename(route.file)}")

    export namespace Route {
      export type LoaderData = T.CreateLoaderData<RouteModule>
      export type ActionData = T.CreateActionData<RouteModule>

      export type LoaderArgs = T.CreateServerLoaderArgs<Params>
      export type ClientLoaderArgs = T.CreateClientLoaderArgs<Params, RouteModule>
      export type ActionArgs = T.CreateServerActionArgs<Params>
      export type ClientActionArgs = T.CreateClientActionArgs<Params, RouteModule>

      export type HydrateFallbackProps = T.CreateHydrateFallbackProps<Params>
      export type ComponentProps = T.CreateComponentProps<Params, LoaderData, ActionData>
      export type ErrorBoundaryProps = T.CreateErrorBoundaryProps<Params, LoaderData, ActionData>
    }
  `;
}

function formatParamProperties(
  routes: RouteManifest,
  route: RouteManifestEntry
) {
  const urlpath = getRouteLineage(routes, route)
    .map((route) => route.path)
    .join("/");
  const params = parseParams(urlpath);
  const indent = "  ".repeat(3);
  const properties = Object.entries(params).map(([name, values]) => {
    if (values.length === 1) {
      const isOptional = values[0];
      return indent + (isOptional ? `"${name}"?: string` : `"${name}": string`);
    }
    const items = values.map((isOptional) =>
      isOptional ? "string | undefined" : "string"
    );
    return indent + `"${name}": [${items.join(", ")}]`;
  });

  // prettier-ignore
  const body =
    properties.length === 0 ? "" :
    "\n" + properties.join("\n") + "\n";

  return body;
}

function getRouteLineage(routes: RouteManifest, route: RouteManifestEntry) {
  const result: RouteManifestEntry[] = [];
  while (route) {
    result.push(route);
    if (!route.parentId) break;
    route = routes[route.parentId];
  }
  result.reverse();
  return result;
}

function parseParams(urlpath: string) {
  const result: Record<string, boolean[]> = {};

  let segments = urlpath.split("/");
  segments
    .filter((s) => s.startsWith(":"))
    .forEach((param) => {
      param = param.slice(1); // omit leading `:`
      let isOptional = param.endsWith("?");
      if (isOptional) {
        param = param.slice(0, -1); // omit trailing `?`
      }

      result[param] ??= [];
      result[param].push(isOptional);
      return;
    });

  const hasSplat = segments.at(-1) === "*";
  if (hasSplat) result["*"] = [false];
  return result;
}
