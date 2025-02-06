import ts from "dedent";

import { type RouteManifestEntry } from "../config/routes";

export function generate(route: RouteManifestEntry): string {
  return ts`
    // React Router generated types for route:
    // ${route.file}

    import type { RouteExports, Routes } from "react-router/types";

    type RouteId = "${route.id}"
    export type Info = Routes[RouteId];

    type Exports = RouteExports[RouteId];

    export namespace Route {
      export type LinkDescriptors = Exports["links"]["return"];
      export type LinksFunction = () => LinkDescriptors;

      export type MetaArgs = Exports["meta"]["args"];
      export type MetaDescriptors = Exports["meta"]["return"];
      export type MetaFunction = (args: MetaArgs) => MetaDescriptors;

      export type HeadersArgs = Exports["headers"]["args"];
      export type HeadersFunction = (args: HeadersArgs) => Headers | HeadersInit;

      export type LoaderArgs = Exports["loader"]["args"];
      export type ClientLoaderArgs = Exports["clientLoader"]["args"];
      export type ActionArgs = Exports["action"]["args"];
      export type ClientActionArgs = Exports["clientAction"]["args"];

      export type HydrateFallbackProps = Exports["HydrateFallback"]["args"];
      export type ComponentProps = Exports["default"]["args"];
      export type ErrorBoundaryProps = Exports["ErrorBoundary"]["args"];
    }
  `;
}
