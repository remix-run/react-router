import ts from "dedent";
import * as Path from "pathe";
import * as Pathe from "pathe/utils";

import { type RouteManifest, type RouteManifestEntry } from "../config/routes";
import { type Context } from "./context";
import { getTypesPath } from "./paths";

export function generate(ctx: Context, route: RouteManifestEntry): string {
  const lineage = getRouteLineage(ctx.config.routes, route);
  const typesPath = getTypesPath(ctx, route);

  const parents = lineage.slice(0, -1);
  const parentTypeImports = parents
    .map((parent, i) => {
      const rel = Path.relative(
        Path.dirname(typesPath),
        getTypesPath(ctx, parent)
      );

      const indent = i === 0 ? "" : "  ".repeat(2);
      let source = noExtension(rel);
      if (!source.startsWith("../")) source = "./" + source;
      return `${indent}import type { Info as Parent${i} } from "${source}.js"`;
    })
    .join("\n");

  return ts`
    // React Router generated types for route:
    // ${route.file}

    import type * as T from "react-router/route-module"
    import type { Routes } from "react-router/types"

    ${parentTypeImports}

    type RouteId = "${route.id}"

    export type Info = Routes[RouteId] & {
      parents: [${parents.map((_, i) => `Parent${i}`).join(", ")}],
      id: RouteId
    }

    export namespace Route {
      export type LinkDescriptors = T.LinkDescriptors
      export type LinksFunction = () => LinkDescriptors

      export type MetaArgs = T.CreateMetaArgs<Info>
      export type MetaDescriptors = T.MetaDescriptors
      export type MetaFunction = (args: MetaArgs) => MetaDescriptors

      export type HeadersArgs = T.HeadersArgs
      export type HeadersFunction = (args: HeadersArgs) => Headers | HeadersInit

      export type LoaderArgs = T.CreateServerLoaderArgs<Info>
      export type ClientLoaderArgs = T.CreateClientLoaderArgs<Info>
      export type ActionArgs = T.CreateServerActionArgs<Info>
      export type ClientActionArgs = T.CreateClientActionArgs<Info>

      export type HydrateFallbackProps = T.CreateHydrateFallbackProps<Info>
      export type ComponentProps = T.CreateComponentProps<Info>
      export type ErrorBoundaryProps = T.CreateErrorBoundaryProps<Info>
    }
  `;
}

const noExtension = (path: string) =>
  Path.join(Path.dirname(path), Pathe.filename(path));

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
