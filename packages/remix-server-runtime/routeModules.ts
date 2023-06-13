import type {
  AgnosticRouteMatch,
  Location,
  Params,
  RouterState,
} from "@remix-run/router";

import type { AppLoadContext, AppData } from "./data";
import type { LinkDescriptor } from "./links";
import type { SerializeFrom } from "./serialize";

type RouteData = RouterState["loaderData"];

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

/**
 * A React component that is rendered when the server throws a Response.
 *
 * @deprecated Please enable the v2_errorBoundary flag to eliminate the need
 * for this type.  If you are still using this, please use `@remix-run/react`'s
 * `CatchBoundaryComponent` type
 */
export type CatchBoundaryComponent = any;

/**
 * A React component that is rendered when there is an error on a route.
 *
 * @deprecated Please enable the v2_errorBoundary flag to eliminate the need
 * for this type.  If you are still using this, please use `@remix-run/react`'s
 * `ErrorBoundaryComponent` type
 */
export type ErrorBoundaryComponent = any;

/**
 * V2 version of the ErrorBoundary that eliminates the distinction between
 * Error and Catch Boundaries and behaves like RR 6.4 errorElement and captures
 * errors with useRouteError()
 *
 * @deprecated Please enable the v2_errorBoundary flag to eliminate the need
 * for this type.  If you are still using this, please use `@remix-run/react`'s
 * `V2_ErrorBoundaryComponent` type
 */
export type V2_ErrorBoundaryComponent = any;

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
 * A function that returns an object of name + content pairs to use for
 * `<meta>` tags for a route. These tags will be merged with (and take
 * precedence over) tags from parent routes.
 *
 * @param Loader - Loader for this meta function's route
 * @param ParentsLoaders - Mapping from a parent's route filepath to that route's loader
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
 * }> = ({ data, parentsData }) => {
 *   const { name } = data
 *   //      ^? string
 *   const { customerCount } = parentsData["routes/sales/customers"]
 *   //      ^? number
 *   const { salesCount } = parentsData["routes/sales"]
 *   //      ^? number
 *   const { hello } = parentsData["root"]
 *   //      ^? "world"
 * }
 * ```
 */
export interface V1_MetaFunction<
  Loader extends LoaderFunction | unknown = unknown,
  ParentsLoaders extends Record<string, LoaderFunction> = {}
> {
  (args: {
    data: Loader extends LoaderFunction ? SerializeFrom<Loader> : AppData;
    parentsData: {
      [k in keyof ParentsLoaders]: SerializeFrom<ParentsLoaders[k]>;
    } & RouteData;
    params: Params;
    location: Location;
  }): HtmlMetaDescriptor;
}

// TODO: Replace in v2
export type MetaFunction<
  Loader extends LoaderFunction | unknown = unknown,
  ParentsLoaders extends Record<string, LoaderFunction> = {}
> = V1_MetaFunction<Loader, ParentsLoaders>;

interface V2_ServerRuntimeMetaMatch<
  RouteId extends string = string,
  Loader extends LoaderFunction | unknown = unknown
> {
  id: RouteId;
  pathname: AgnosticRouteMatch["pathname"];
  data: Loader extends LoaderFunction ? SerializeFrom<Loader> : unknown;
  handle?: unknown;
  params: AgnosticRouteMatch["params"];
  meta: V2_ServerRuntimeMetaDescriptor[];
}

type V2_ServerRuntimeMetaMatches<
  MatchLoaders extends Record<string, unknown> = Record<string, unknown>
> = Array<
  {
    [K in keyof MatchLoaders]: V2_ServerRuntimeMetaMatch<
      Exclude<K, number | symbol>,
      MatchLoaders[K]
    >;
  }[keyof MatchLoaders]
>;

export interface V2_ServerRuntimeMetaArgs<
  Loader extends LoaderFunction | unknown = unknown,
  MatchLoaders extends Record<string, unknown> = Record<string, unknown>
> {
  data:
    | (Loader extends LoaderFunction ? SerializeFrom<Loader> : AppData)
    | undefined;
  params: Params;
  location: Location;
  matches: V2_ServerRuntimeMetaMatches<MatchLoaders>;
}

export interface V2_ServerRuntimeMetaFunction<
  Loader extends LoaderFunction | unknown = unknown,
  ParentsLoaders extends Record<string, LoaderFunction> = {}
> {
  (
    args: V2_ServerRuntimeMetaArgs<Loader, ParentsLoaders>
  ): V2_ServerRuntimeMetaDescriptor[];
}

/**
 * A name/content pair used to render `<meta>` tags in a meta function for a
 * route. The value can be either a string, which will render a single `<meta>`
 * tag, or an array of strings that will render multiple tags with the same
 * `name` attribute.
 */
export interface V1_HtmlMetaDescriptor {
  charset?: "utf-8";
  charSet?: "utf-8";
  title?: string;
  [name: string]:
    | null
    | string
    | undefined
    | Record<string, string>
    | Array<Record<string, string> | string>;
}

// TODO: Replace in v2
export type HtmlMetaDescriptor = V1_HtmlMetaDescriptor;

export type MetaDescriptor = HtmlMetaDescriptor;

export type V2_ServerRuntimeMetaDescriptor =
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
 *
 * @deprecated Please use `@remix-run/react`'s `RouteComponent` type instead
 */
export type RouteComponent = any;

/**
 * An arbitrary object that is associated with a route.
 */
export type RouteHandle = any;

export interface EntryRouteModule {
  CatchBoundary?: CatchBoundaryComponent;
  ErrorBoundary?: ErrorBoundaryComponent | V2_ErrorBoundaryComponent;
  default: RouteComponent;
  handle?: RouteHandle;
  links?: LinksFunction;
  meta?: MetaFunction | HtmlMetaDescriptor;
}

export interface ServerRouteModule extends EntryRouteModule {
  action?: ActionFunction;
  headers?: HeadersFunction | { [name: string]: string };
  loader?: LoaderFunction;
}
