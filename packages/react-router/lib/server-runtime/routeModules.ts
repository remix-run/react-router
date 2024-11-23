import type { ActionFunction, LoaderFunction } from "../router/utils";
import type {
  ClientActionFunction,
  ClientLoaderFunction,
  LinksFunction,
  MetaFunction,
} from "../dom/ssr/routeModules";

export interface RouteModules<RouteModule> {
  [routeId: string]: RouteModule | undefined;
}

export type HeadersArgs = {
  loaderHeaders: Headers;
  parentHeaders: Headers;
  actionHeaders: Headers;
  errorHeaders: Headers | undefined;
};

/**
 * A function that returns HTTP headers to be used for a route. These headers
 * will be merged with (and take precedence over) headers from parent routes.
 */
export interface HeadersFunction {
  (args: HeadersArgs): Headers | HeadersInit;
}

type LdJsonObject = { [Key in string]: LdJsonValue } & {
  [Key in string]?: LdJsonValue | undefined;
};
type LdJsonArray = LdJsonValue[] | readonly LdJsonValue[];
type LdJsonPrimitive = string | number | boolean | null;
type LdJsonValue = LdJsonPrimitive | LdJsonObject | LdJsonArray;

/**
 * An arbitrary object that is associated with a route.
 */
export type RouteHandle = unknown;

export interface EntryRouteModule {
  clientAction?: ClientActionFunction | undefined;
  clientLoader?: ClientLoaderFunction | undefined;
  ErrorBoundary?: any | undefined; // Weakly typed because server-runtime is not React-aware
  HydrateFallback?: any | undefined; // Weakly typed because server-runtime is not React-aware
  Layout?: any | undefined; // Weakly typed because server-runtime is not React-aware
  default: any; // Weakly typed because server-runtime is not React-aware
  handle?: RouteHandle | undefined;
  links?: LinksFunction | undefined;
  meta?: MetaFunction | undefined;
}

export interface ServerRouteModule extends EntryRouteModule {
  action?: ActionFunction | undefined;
  headers?: HeadersFunction | { [name: string]: string } | undefined;
  loader?: LoaderFunction | undefined;
}
