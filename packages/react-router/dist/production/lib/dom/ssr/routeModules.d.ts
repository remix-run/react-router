
import { Location } from "../../router/history.js";
import { ActionFunction, ActionFunctionArgs, DataRouteMatch, DataStrategyResult, LoaderFunction, LoaderFunctionArgs, MiddlewareFunction, Params, ShouldRevalidateFunction } from "../../router/utils.js";
import { LinkDescriptor } from "../../router/links.js";
import { SerializeFrom } from "../../types/route-data.js";
import { ComponentType, ReactElement } from "react";

//#region lib/dom/ssr/routeModules.d.ts
interface RouteModules {
  [routeId: string]: RouteModule | undefined;
}
/**
 * The shape of a route module shipped to the client
 */
interface RouteModule {
  clientAction?: ClientActionFunction;
  clientLoader?: ClientLoaderFunction;
  clientMiddleware?: MiddlewareFunction<Record<string, DataStrategyResult>>[];
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
 * The shape of a route module on the server
 */
interface ServerRouteModule extends RouteModule {
  action?: ActionFunction;
  headers?: HeadersFunction | {
    [name: string]: string;
  };
  loader?: LoaderFunction;
  middleware?: MiddlewareFunction<Response>[];
}
/**
 * A function that handles data mutations for a route on the client
 */
type ClientActionFunction = (args: ClientActionFunctionArgs) => ReturnType<ActionFunction>;
/**
 * Arguments passed to a route `clientAction` function
 */
type ClientActionFunctionArgs = ActionFunctionArgs & {
  serverAction: <T = unknown>() => Promise<SerializeFrom<T>>;
};
/**
 * A function that loads data for a route on the client
 */
type ClientLoaderFunction = ((args: ClientLoaderFunctionArgs) => ReturnType<LoaderFunction>) & {
  hydrate?: boolean;
};
/**
 * Arguments passed to a route `clientLoader` function
 */
type ClientLoaderFunctionArgs = LoaderFunctionArgs & {
  serverLoader: <T = unknown>() => Promise<SerializeFrom<T>>;
};
/**
 * ErrorBoundary to display for this route
 */
type ErrorBoundaryComponent = ComponentType;
type HeadersArgs = {
  loaderHeaders: Headers;
  parentHeaders: Headers;
  actionHeaders: Headers;
  errorHeaders: Headers | undefined;
};
/**
 * A function that returns HTTP headers to be used for a route. These headers
 * will be merged with (and take precedence over) headers from parent routes.
 */
interface HeadersFunction {
  (args: HeadersArgs): Headers | HeadersInit;
}
/**
 * `<Route HydrateFallback>` component to render on initial loads
 * when client loaders are present
 */
type HydrateFallbackComponent = ComponentType;
/**
 * Optional, root-only `<Route Layout>` component to wrap the root content in.
 * Useful for defining the <html>/<head>/<body> document shell shared by the
 * Component, HydrateFallback, and ErrorBoundary
 */
type LayoutComponent = ComponentType<{
  children: ReactElement<unknown, ErrorBoundaryComponent | HydrateFallbackComponent | RouteComponent>;
}>;
/**
 * A function that defines `<link>` tags to be inserted into the `<head>` of
 * the document on route transitions.
 *
 * @see https://reactrouter.com/start/framework/route-module#meta
 */
interface LinksFunction {
  (): LinkDescriptor[];
}
interface MetaMatch<RouteId extends string = string, Loader extends LoaderFunction | ClientLoaderFunction | unknown = unknown> {
  id: RouteId;
  pathname: DataRouteMatch["pathname"];
  loaderData: Loader extends LoaderFunction | ClientLoaderFunction ? SerializeFrom<Loader> : unknown;
  handle?: RouteHandle;
  params: DataRouteMatch["params"];
  meta: MetaDescriptor[];
  error?: unknown;
}
type MetaMatches<MatchLoaders extends Record<string, LoaderFunction | ClientLoaderFunction | unknown> = Record<string, unknown>> = Array<{ [K in keyof MatchLoaders]: MetaMatch<Exclude<K, number | symbol>, MatchLoaders[K]> }[keyof MatchLoaders]>;
interface MetaArgs<Loader extends LoaderFunction | ClientLoaderFunction | unknown = unknown, MatchLoaders extends Record<string, LoaderFunction | ClientLoaderFunction | unknown> = Record<string, unknown>> {
  loaderData: (Loader extends LoaderFunction | ClientLoaderFunction ? SerializeFrom<Loader> : unknown) | undefined;
  params: Params;
  location: Location;
  matches: MetaMatches<MatchLoaders>;
  error?: unknown;
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
 * const loader = () => ({ hello: "world" })
 * export type Loader = typeof loader
 *
 * // app/routes/sales.tsx
 * const loader = () => ({ salesCount: 1074 })
 * export type Loader = typeof loader
 *
 * // app/routes/sales/customers.tsx
 * const loader = () => ({ customerCount: 74 })
 * export type Loader = typeof loader
 *
 * // app/routes/sales/customers/$customersId.tsx
 * import type { Loader as RootLoader } from "../../../root"
 * import type { Loader as SalesLoader } from "../../sales"
 * import type { Loader as CustomersLoader } from "../../sales/customers"
 *
 * const loader = () => ({ name: "Customer name" })
 *
 * const meta: MetaFunction<typeof loader, {
 *  "root": RootLoader,
 *  "routes/sales": SalesLoader,
 *  "routes/sales/customers": CustomersLoader,
 * }> = ({ loaderData, matches }) => {
 *   const { name } = loaderData
 *   //      ^? string
 *   const { customerCount } = matches.find((match) => match.id === "routes/sales/customers").loaderData
 *   //      ^? number
 *   const { salesCount } = matches.find((match) => match.id === "routes/sales").loaderData
 *   //      ^? number
 *   const { hello } = matches.find((match) => match.id === "root").loaderData
 *   //      ^? "world"
 * }
 * ```
 */
interface MetaFunction<Loader extends LoaderFunction | ClientLoaderFunction | unknown = unknown, MatchLoaders extends Record<string, LoaderFunction | ClientLoaderFunction | unknown> = Record<string, unknown>> {
  (args: MetaArgs<Loader, MatchLoaders>): MetaDescriptor[] | undefined;
}
type MetaDescriptor = {
  charSet: "utf-8";
} | {
  title: string;
} | {
  name: string;
  content: string;
} | {
  property: string;
  content: string;
} | {
  httpEquiv: string;
  content: string;
} | {
  "script:ld+json": LdJsonObject | LdJsonObject[];
} | {
  tagName: "meta" | "link";
  [name: string]: string;
} | {
  [name: string]: unknown;
};
type LdJsonObject = { [Key in string]: LdJsonValue } & { [Key in string]?: LdJsonValue | undefined };
type LdJsonArray = LdJsonValue[] | readonly LdJsonValue[];
type LdJsonPrimitive = string | number | boolean | null;
type LdJsonValue = LdJsonPrimitive | LdJsonObject | LdJsonArray;
/**
 * A React component that is rendered for a route.
 */
type RouteComponent = ComponentType<{}>;
/**
 * An arbitrary object that is associated with a route.
 *
 * @see https://reactrouter.com/how-to/using-handle
 */
type RouteHandle = unknown;
//#endregion
export { ClientActionFunction, ClientActionFunctionArgs, ClientLoaderFunction, ClientLoaderFunctionArgs, HeadersArgs, HeadersFunction, LinksFunction, MetaArgs, MetaDescriptor, MetaFunction, RouteModules, ServerRouteModule };