import type { Location } from "../router/history";
import type {
  ActionFunction as RRActionFunction,
  ActionFunctionArgs as RRActionFunctionArgs,
  AgnosticRouteMatch,
  LoaderFunction as RRLoaderFunction,
  LoaderFunctionArgs as RRLoaderFunctionArgs,
  Params,
} from "../router/utils";
import type { AppData, AppLoadContext } from "./data";
import type { SerializeFrom } from "../dom/ssr/components";
import type { LinkDescriptor } from "../router/links";

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
};

/**
 * A function that handles data mutations for a route on the client
 * @private Public API is exported from @react-router/react
 */
type ClientActionFunction = (
  args: ClientActionFunctionArgs
) => ReturnType<RRActionFunction>;

/**
 * Arguments passed to a route `clientAction` function
 * @private Public API is exported from @react-router/react
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
};

/**
 * A function that loads data for a route on the client
 * @private Public API is exported from @react-router/react
 */
type ClientLoaderFunction = ((
  args: ClientLoaderFunctionArgs
) => ReturnType<RRLoaderFunction>) & {
  hydrate?: boolean;
};

/**
 * Arguments passed to a route `clientLoader` function
 * @private Public API is exported from @react-router/react
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
  meta?: MetaFunction;
}

export interface ServerRouteModule extends EntryRouteModule {
  action?: ActionFunction;
  headers?: HeadersFunction | { [name: string]: string };
  loader?: LoaderFunction;
}
