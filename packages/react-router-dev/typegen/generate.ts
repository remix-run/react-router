import dedent from "dedent";
import * as Path from "pathe";
import * as Pathe from "pathe/utils";

import { type RouteManifest, type RouteManifestEntry } from "../config/routes";
import { getTypesPath, type Context } from "./context";

export function generate(ctx: Context, route: RouteManifestEntry): string {
  const lineage = getRouteLineage(ctx.config.routes, route);
  const urlpath = lineage.map((route) => route.path).join("/");
  const typesPath = getTypesPath(ctx, route);

  const parents = lineage.slice(0, -1);
  const parentTypeImports = parents
    .map((parent, i) => {
      let rel = Path.relative(
        Path.dirname(typesPath),
        getTypesPath(ctx, parent)
      );
      if (rel.startsWith("+")) rel = "./" + rel;
      const indent = i === 0 ? "" : "  ".repeat(2);
      const imp = `${indent}import type { Info as Parent${i} } from "${rel}"`;
      return imp;
    })
    .join("\n");

  return dedent`
    // React Router generated types for route:
    // ${route.file}

    import type * as T from "react-router/route-module"

    ${parentTypeImports}
    type Parents = [${parents.map((_, i) => `Parent${i}`).join(", ")}]

    type Params = {${formatParamProperties(urlpath)}}

    type RouteModule = typeof import("./${Pathe.filename(route.file)}")
    type LoaderData = T.CreateLoaderData<RouteModule>
    type ActionData = T.CreateActionData<RouteModule>

    export type Info = {
      id: "${route.id}"
      file: "${route.file}"
      path: "${route.path}"
      params: Params
      loaderData: LoaderData
      actionData: ActionData
    }

    export namespace Route {

      export type LinkDescriptors = T.LinkDescriptors
      export type LinksFunction = () => LinkDescriptors

      export type MetaArgs = T.CreateMetaArgs<Params, LoaderData, Parents>
      export type MetaDescriptors = T.MetaDescriptors
      export type MetaFunction = (args: MetaArgs) => MetaDescriptors

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

function formatParamProperties(urlpath: string) {
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

function parseParams(urlpath: string) {
  const result: Record<string, boolean[]> = {};

  let segments = urlpath.split("/");
  segments.forEach((segment) => {
    const match = segment.match(/^:([\w-]+)(\?)?/);
    if (!match) return;
    const param = match[1];
    const isOptional = match[2] !== undefined;

    result[param] ??= [];
    result[param].push(isOptional);
    return;
  });

  const hasSplat = segments.at(-1) === "*";
  if (hasSplat) result["*"] = [false];
  return result;
}
