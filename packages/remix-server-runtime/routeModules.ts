import type {
  ActionFunction as RRActionFunction,
  ActionFunctionArgs as RRActionFunctionArgs,
  AgnosticRouteMatch,
  LoaderFunction as RRLoaderFunction,
  LoaderFunctionArgs as RRLoaderFunctionArgs,
  Location,
  Params,
} from "@remix-run/router";

import type { AppData, AppLoadContext } from "./data";
import type { LinkDescriptor } from "./links";
import type { SerializeFrom } from "./serialize";

export interface RouteModules<RouteModule> {
  [routeId: string]: RouteModule | undefined;
}

/**
 * @deprecated Use `LoaderFunctionArgs`/`ActionFunctionArgs` instead
 */
export type DataFunctionArgs = RRActionFunctionArgs<AppLoadContext> &
  RRLoaderFunctionArgs<AppLoadContext> & {
    // Context is always provided in Remix, and typed for module augmentation support.
    // RR also doesn't export DataFunctionArgs, so we extend the two interfaces here
    // even tough they're identical under the hood
    context: AppLoadContext;
  };

export const ResponseStubOperationsSymbol = Symbol("ResponseStubOperations");
export type ResponseStubOperation = [
  "set" | "append" | "delete",
  string,
  string?
];
/**
 * A stubbed response to let you set the status/headers of your response from
 * loader/action functions
 */
export type ResponseStub = {
  status: number | undefined;
  headers: Headers;
  [ResponseStubOperationsSymbol]: ResponseStubOperation[];
};

/**
 * A function that handles data mutations for a route on the server
 */
export type ActionFunction = (
  args: ActionFunctionArgs
) => ReturnType<RRActionFunction>;

/**
 * Arguments passed to a route `action` function
 */
export type ActionFunctionArgs = RRActionFunctionArgs<AppLoadContext> & {
  // Context is always provided in Remix, and typed for module augmentation support.
  context: AppLoadContext;
  // TODO: (v7) Make this non-optional once single-fetch is the default
  response?: ResponseStub;
};

/**
 * A function that handles data mutations for a route on the client
 * @private Public API is exported from @remix-run/react
 */
type ClientActionFunction = (
  args: ClientActionFunctionArgs
) => ReturnType<RRActionFunction>;

/**
 * Arguments passed to a route `clientAction` function
 * @private Public API is exported from @remix-run/react
 */
export type ClientActionFunctionArgs = RRActionFunctionArgs<undefined> & {
  serverAction: <T = AppData>() => Promise<SerializeFrom<T>>;
};

/**
 * A function that loads data for a route on the server
 */
export type LoaderFunction = (
  args: LoaderFunctionArgs
) => ReturnType<RRLoaderFunction>;

/**
 * Arguments passed to a route `loader` function
 */
export type LoaderFunctionArgs = RRLoaderFunctionArgs<AppLoadContext> & {
  // Context is always provided in Remix, and typed for module augmentation support.
  context: AppLoadContext;
  // TODO: (v7) Make this non-optional once single-fetch is the default
  response?: ResponseStub;
};

/**
 * A function that loads data for a route on the client
 * @private Public API is exported from @remix-run/react
 */
type ClientLoaderFunction = ((
  args: ClientLoaderFunctionArgs
) => ReturnType<RRLoaderFunction>) & {
  hydrate?: boolean;
};

/**
 * Arguments passed to a route `clientLoader` function
 * @private Public API is exported from @remix-run/react
 */
export type ClientLoaderFunctionArgs = RRLoaderFunctionArgs<undefined> & {
  serverLoader: <T = AppData>() => Promise<SerializeFrom<T>>;
};

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
  handle?: RouteHandle;
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
  error?: unknown;
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
export type RouteHandle = unknown;

export interface EntryRouteModule {
  clientAction?: ClientActionFunction;
  clientLoader?: ClientLoaderFunction;
  ErrorBoundary?: any; // Weakly typed because server-runtime is not React-aware
  HydrateFallback?: any; // Weakly typed because server-runtime is not React-aware
  Layout?: any; // Weakly typed because server-runtime is not React-aware
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
