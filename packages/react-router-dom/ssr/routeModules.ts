import type { ComponentType, ReactElement } from "react";
import type {
  ActionFunction as RRActionFunction,
  ActionFunctionArgs as RRActionFunctionArgs,
  LoaderFunction as RRLoaderFunction,
  LoaderFunctionArgs as RRLoaderFunctionArgs,
  DataRouteMatch,
  Params,
  Location,
  ShouldRevalidateFunction,
} from "react-router-dom";
import type { LoaderFunction, SerializeFrom } from "@remix-run/server-runtime";

import type { AppData } from "./data";
import type { LinkDescriptor } from "./links";
import type { EntryRoute } from "./routes";

export interface RouteModules {
  [routeId: string]: RouteModule | undefined;
}

export interface RouteModule {
  clientAction?: ClientActionFunction;
  clientLoader?: ClientLoaderFunction;
  ErrorBoundary?: ErrorBoundaryComponent;
  HydrateFallback?: HydrateFallbackComponent;
  Layout?: LayoutComponent;
  default: RouteComponent;
  handle?: RouteHandle;
  links?: LinksFunction;
  meta?: MetaFunction;
  shouldRevalidate?: ShouldRevalidateFunction;
}

/**
 * A function that handles data mutations for a route on the client
 */
export type ClientActionFunction = (
  args: ClientActionFunctionArgs
) => ReturnType<RRActionFunction>;

/**
 * Arguments passed to a route `clientAction` function
 */
export type ClientActionFunctionArgs = RRActionFunctionArgs<undefined> & {
  serverAction: <T = AppData>() => Promise<SerializeFrom<T>>;
};

/**
 * A function that loads data for a route on the client
 */
export type ClientLoaderFunction = ((
  args: ClientLoaderFunctionArgs
) => ReturnType<RRLoaderFunction>) & {
  hydrate?: boolean;
};

/**
 * Arguments passed to a route `clientLoader` function
 */
export type ClientLoaderFunctionArgs = RRLoaderFunctionArgs<undefined> & {
  serverLoader: <T = AppData>() => Promise<SerializeFrom<T>>;
};

/**
 * ErrorBoundary to display for this route
 */
export type ErrorBoundaryComponent = ComponentType;

/**
 * `<Route HydrateFallback>` component to render on initial loads
 * when client loaders are present
 */
export type HydrateFallbackComponent = ComponentType;

/**
 * Optional, root-only `<Route Layout>` component to wrap the root content in.
 * Useful for defining the <html>/<head>/<body> document shell shared by the
 * Component, HydrateFallback, and ErrorBoundary
 */
export type LayoutComponent = ComponentType<{
  children: ReactElement<
    unknown,
    ErrorBoundaryComponent | HydrateFallbackComponent | RouteComponent
  >;
}>;

/**
 * A function that defines `<link>` tags to be inserted into the `<head>` of
 * the document on route transitions.
 *
 * @see https://remix.run/route/meta
 */
export interface LinksFunction {
  (): LinkDescriptor[];
}

export interface MetaMatch<
  RouteId extends string = string,
  Loader extends LoaderFunction | unknown = unknown
> {
  id: RouteId;
  pathname: DataRouteMatch["pathname"];
  data: Loader extends LoaderFunction ? SerializeFrom<Loader> : unknown;
  handle?: RouteHandle;
  params: DataRouteMatch["params"];
  meta: MetaDescriptor[];
  error?: unknown;
}

export type MetaMatches<
  MatchLoaders extends Record<string, LoaderFunction | unknown> = Record<
    string,
    unknown
  >
> = Array<
  {
    [K in keyof MatchLoaders]: MetaMatch<
      Exclude<K, number | symbol>,
      MatchLoaders[K]
    >;
  }[keyof MatchLoaders]
>;

export interface MetaArgs<
  Loader extends LoaderFunction | unknown = unknown,
  MatchLoaders extends Record<string, LoaderFunction | unknown> = Record<
    string,
    unknown
  >
> {
  data:
    | (Loader extends LoaderFunction ? SerializeFrom<Loader> : AppData)
    | undefined;
  params: Params;
  location: Location;
  matches: MetaMatches<MatchLoaders>;
  error?: unknown;
}

export interface MetaFunction<
  Loader extends LoaderFunction | unknown = unknown,
  MatchLoaders extends Record<string, LoaderFunction | unknown> = Record<
    string,
    unknown
  >
> {
  (args: MetaArgs<Loader, MatchLoaders>): MetaDescriptor[] | undefined;
}

export type MetaDescriptor =
  | { charSet: "utf-8" }
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }
  | { httpEquiv: string; content: string }
  | { "script:ld+json": LdJsonObject }
  | { tagName: "meta" | "link"; [name: string]: string }
  | { [name: string]: unknown };

type LdJsonObject = { [Key in string]: LdJsonValue } & {
  [Key in string]?: LdJsonValue | undefined;
};
type LdJsonArray = LdJsonValue[] | readonly LdJsonValue[];
type LdJsonPrimitive = string | number | boolean | null;
type LdJsonValue = LdJsonPrimitive | LdJsonObject | LdJsonArray;

/**
 * A React component that is rendered for a route.
 */
export type RouteComponent = ComponentType<{}>;

/**
 * An arbitrary object that is associated with a route.
 *
 * @see https://remix.run/route/handle
 */
export type RouteHandle = unknown;

export async function loadRouteModule(
  route: EntryRoute,
  routeModulesCache: RouteModules
): Promise<RouteModule> {
  if (route.id in routeModulesCache) {
    return routeModulesCache[route.id] as RouteModule;
  }

  try {
    let routeModule = await import(/* webpackIgnore: true */ route.module);
    routeModulesCache[route.id] = routeModule;
    return routeModule;
  } catch (error: unknown) {
    // User got caught in the middle of a deploy and the CDN no longer has the
    // asset we're trying to import! Reload from the server and the user
    // (should) get the new manifest--unless the developer purged the static
    // assets, the manifest path, but not the documents 😬
    if (
      window.__remixContext.isSpaMode &&
      // @ts-expect-error
      typeof import.meta.hot !== "undefined"
    ) {
      // In SPA Mode (which implies vite) we don't want to perform a hard reload
      // on dev-time errors since it's a vite compilation error and a reload is
      // just going to fail with the same issue.  Let the UI bubble to the error
      // boundary and let them see the error in the overlay or the dev server log
      console.error(`Error loading route module \`${route.module}\`:`, error);
      throw error;
    }
    window.location.reload();
    return new Promise(() => {
      // check out of this hook cause the DJs never gonna re[s]olve this
    });
  }
}
