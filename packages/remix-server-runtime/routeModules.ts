import type { AgnosticRouteMatch, Location, Params } from "@remix-run/router";

import type { AppLoadContext, AppData } from "./data";
import type { LinkDescriptor } from "./links";
import type { SerializeFrom } from "./serialize";

export interface RouteModules<RouteModule> {
  [routeId: string]: RouteModule;
}

/**
 * The arguments passed to ActionFunction and LoaderFunction.
 *
 * Note this is almost identical to React Router's version but over there the
 * context is optional since it's only there during static handler invocations.
 * Keeping Remix's own definition for now so it can differentiate between
 * client/server
 */
export interface DataFunctionArgs {
  request: Request;
  context: AppLoadContext;
  params: Params;
}

export type LoaderArgs = DataFunctionArgs;

export type ActionArgs = DataFunctionArgs;

/**
 * A function that handles data mutations for a route.
 */
export interface ActionFunction {
  (args: DataFunctionArgs):
    | Promise<Response>
    | Response
    | Promise<AppData>
    | AppData;
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

/**
 * A function that defines `<link>` tags to be inserted into the `<head>` of
 * the document on route transitions.
 */
export interface LinksFunction {
  (): LinkDescriptor[];
}

/**
 * A function that loads data for a route.
 */
export interface LoaderFunction {
  (args: DataFunctionArgs):
    | Promise<Response>
    | Response
    | Promise<AppData>
    | AppData;
}

/**
 * A function that returns an array of data objects to use for rendering
 * metadata HTML tags in a route. These tags are not rendered on descendant
 * routes in the route hierarchy. In other words, they will only be rendered on
 * the route in which they are exported.
 *
 * @param Loader - The type of the current route's loader function
 * @param MatchLoaders - Mapping from a parent route's filepath to its loader
 * function type
 *
 * Note that parent route filepaths are relative to the `app/` directory.
 *
 * For example, if this meta function is for `/sales/customers/$customerId`:
 *
 * ```ts
 * // app/root.tsx
 * const loader = () => {
 *  return json({ hello: "world" } as const)
 * }
 * export type Loader = typeof loader
 *
 * // app/routes/sales.tsx
 * const loader = () => {
 *  return json({ salesCount: 1074 })
 * }
 * export type Loader = typeof loader
 *
 * // app/routes/sales/customers.tsx
 * const loader = () => {
 *   return json({ customerCount: 74 })
 * }
 * export type Loader = typeof loader
 *
 * // app/routes/sales/customers/$customersId.tsx
 * import type { Loader as RootLoader } from "../../../root"
 * import type { Loader as SalesLoader } from "../../sales"
 * import type { Loader as CustomersLoader } from "../../sales/customers"
 *
 * const loader = () => {
 *   return json({ name: "Customer name" })
 * }
 *
 * const meta: MetaFunction<typeof loader, {
 *  "root": RootLoader,
 *  "routes/sales": SalesLoader,
 *  "routes/sales/customers": CustomersLoader,
 * }> = ({ data, matches }) => {
 *   const { name } = data
 *   //      ^? string
 *   const { customerCount } = matches.find((match) => match.id === "routes/sales/customers").data
 *   //      ^? number
 *   const { salesCount } = matches.find((match) => match.id === "routes/sales").data
 *   //      ^? number
 *   const { hello } = matches.find((match) => match.id === "root").data
 *   //      ^? "world"
 * }
 * ```
 */
export interface ServerRuntimeMetaFunction<
  Loader extends LoaderFunction | unknown = unknown,
  ParentsLoaders extends Record<string, LoaderFunction | unknown> = Record<
    string,
    unknown
  >
> {
  (
    args: ServerRuntimeMetaArgs<Loader, ParentsLoaders>
  ): ServerRuntimeMetaDescriptor[];
}

interface ServerRuntimeMetaMatch<
  RouteId extends string = string,
  Loader extends LoaderFunction | unknown = unknown
> {
  id: RouteId;
  pathname: AgnosticRouteMatch["pathname"];
  data: Loader extends LoaderFunction ? SerializeFrom<Loader> : unknown;
  handle?: unknown;
  params: AgnosticRouteMatch["params"];
  meta: ServerRuntimeMetaDescriptor[];
  error?: unknown;
}

type ServerRuntimeMetaMatches<
  MatchLoaders extends Record<string, LoaderFunction | unknown> = Record<
    string,
    unknown
  >
> = Array<
  {
    [K in keyof MatchLoaders]: ServerRuntimeMetaMatch<
      Exclude<K, number | symbol>,
      MatchLoaders[K]
    >;
  }[keyof MatchLoaders]
>;

export interface ServerRuntimeMetaArgs<
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
  matches: ServerRuntimeMetaMatches<MatchLoaders>;
}

export type ServerRuntimeMetaDescriptor =
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
 * An arbitrary object that is associated with a route.
 */
export type RouteHandle = any;

export interface EntryRouteModule {
  ErrorBoundary?: any; // Weakly typed because server-runtime is not React-aware
  default: any; // Weakly typed because server-runtime is not React-aware
  handle?: RouteHandle;
  links?: LinksFunction;
  meta?: ServerRuntimeMetaFunction;
}

export interface ServerRouteModule extends EntryRouteModule {
  action?: ActionFunction;
  headers?: HeadersFunction | { [name: string]: string };
  loader?: LoaderFunction;
}
