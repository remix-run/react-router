
import { Location, Path, To } from "./history.js";
import * as React$1 from "react";

//#region lib/router/utils.d.ts
type MaybePromise<T> = T | Promise<T>;
/**
 * Map of routeId -> data returned from a loader/action/error
 */
interface RouteData {
  [routeId: string]: any;
}
type LowerCaseFormMethod = "get" | "post" | "put" | "patch" | "delete";
type UpperCaseFormMethod = Uppercase<LowerCaseFormMethod>;
/**
 * Users can specify either lowercase or uppercase form methods on `<Form>`,
 * useSubmit(), `<fetcher.Form>`, etc.
 */
type HTMLFormMethod = LowerCaseFormMethod | UpperCaseFormMethod;
/**
 * Active navigation/fetcher form methods are exposed in uppercase on the
 * RouterState. This is to align with the normalization done via fetch().
 */
type FormMethod = UpperCaseFormMethod;
type FormEncType = "application/x-www-form-urlencoded" | "multipart/form-data" | "application/json" | "text/plain";
type JsonObject = { [Key in string]: JsonValue } & { [Key in string]?: JsonValue | undefined };
type JsonArray = JsonValue[] | readonly JsonValue[];
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
/**
 * @private
 * Internal interface to pass around for action submissions, not intended for
 * external consumption
 */
type Submission = {
  formMethod: FormMethod;
  formAction: string;
  formEncType: FormEncType;
  formData: FormData;
  json: undefined;
  text: undefined;
} | {
  formMethod: FormMethod;
  formAction: string;
  formEncType: FormEncType;
  formData: undefined;
  json: JsonValue;
  text: undefined;
} | {
  formMethod: FormMethod;
  formAction: string;
  formEncType: FormEncType;
  formData: undefined;
  json: undefined;
  text: string;
};
/**
 * A context instance used as the key for the `get`/`set` methods of a
 * {@link RouterContextProvider}. Accepts an optional default
 * value to be returned if no value has been set.
 */
interface RouterContext<T = unknown> {
  defaultValue?: T;
}
/**
 * Creates a type-safe {@link RouterContext} object that can be used to
 * store and retrieve arbitrary values in [`action`](../../start/framework/route-module#action)s,
 * [`loader`](../../start/framework/route-module#loader)s, and [middleware](../../how-to/middleware).
 * Similar to React's [`createContext`](https://react.dev/reference/react/createContext),
 * but specifically designed for React Router's request/response lifecycle.
 *
 * If a `defaultValue` is provided, it will be returned from `context.get()`
 * when no value has been set for the context. Otherwise, reading this context
 * when no value has been set will throw an error.
 *
 * ```tsx filename=app/context.ts
 * import { createContext } from "react-router";
 *
 * // Create a context for user data
 * export const userContext =
 *   createContext<User | null>(null);
 * ```
 *
 * ```tsx filename=app/middleware/auth.ts
 * import { getUserFromSession } from "~/auth.server";
 * import { userContext } from "~/context";
 *
 * export const authMiddleware = async ({
 *   context,
 *   request,
 * }) => {
 *   const user = await getUserFromSession(request);
 *   context.set(userContext, user);
 * };
 * ```
 *
 * ```tsx filename=app/routes/profile.tsx
 * import { userContext } from "~/context";
 *
 * export async function loader({
 *   context,
 * }: Route.LoaderArgs) {
 *   const user = context.get(userContext);
 *
 *   if (!user) {
 *     throw new Response("Unauthorized", { status: 401 });
 *   }
 *
 *   return { user };
 * }
 * ```
 *
 * @public
 * @category Utils
 * @mode framework
 * @mode data
 * @param defaultValue An optional default value for the context. This value
 * will be returned if no value has been set for this context.
 * @returns A {@link RouterContext} object that can be used with
 * `context.get()` and `context.set()` in [`action`](../../start/framework/route-module#action)s,
 * [`loader`](../../start/framework/route-module#loader)s, and [middleware](../../how-to/middleware).
 */
declare function createContext<T>(defaultValue?: T): RouterContext<T>;
/**
 * Provides methods for writing/reading values in application context in a
 * type-safe way. Primarily for usage with [middleware](../../how-to/middleware).
 *
 * @example
 * import {
 *   createContext,
 *   RouterContextProvider
 * } from "react-router";
 *
 * const userContext = createContext<User | null>(null);
 * const contextProvider = new RouterContextProvider();
 * contextProvider.set(userContext, getUser());
 * //                               ^ Type-safe
 * const user = contextProvider.get(userContext);
 * //    ^ User
 *
 * @public
 * @category Utils
 * @mode framework
 * @mode data
 */
declare class RouterContextProvider {
  #private;
  /**
   * Create a new `RouterContextProvider` instance
   * @param init An optional initial context map to populate the provider with
   */
  constructor(init?: Map<RouterContext, unknown>);
  /**
   * Access a value from the context. If no value has been set for the context,
   * it will return the context's `defaultValue` if provided, or throw an error
   * if no `defaultValue` was set.
   * @param context The context to get the value for
   * @returns The value for the context, or the context's `defaultValue` if no
   * value was set
   */
  get<T>(context: RouterContext<T>): T;
  /**
   * Set a value for the context. If the context already has a value set, this
   * will overwrite it.
   *
   * @param context The context to set the value for
   * @param value The value to set for the context
   * @returns {void}
   */
  set<C extends RouterContext>(context: C, value: C extends RouterContext<infer T> ? T : never): void;
}
type DefaultContext = Readonly<RouterContextProvider>;
/**
 * @private
 * Arguments passed to route loader/action functions.  Same for now but we keep
 * this as a private implementation detail in case they diverge in the future.
 */
interface DataFunctionArgs<Context> {
  /** A {@link https://developer.mozilla.org/en-US/docs/Web/API/Request Fetch Request instance} which you can use to read headers (like cookies, and {@link https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams URLSearchParams} from the request. */
  request: Request;
  /**
   * A URL instance representing the application location being navigated to or
   * fetched.
   *
   * In Framework mode, this is a normalized URL with React-Router-specific
   * implementation details removed (`.data` suffixes, `index`/`_routes` search
   * params). For the raw incoming URL, use `request.url`.
   */
  url: URL;
  /**
   * Matched un-interpolated route pattern for the current path (i.e., /blog/:slug).
   * Mostly useful as a identifier to aggregate on for logging/tracing/etc.
   */
  pattern: string;
  /**
   * {@link https://reactrouter.com/start/framework/routing#dynamic-segments Dynamic route params} for the current route.
   * @example
   * // app/routes.ts
   * route("teams/:teamId", "./team.tsx"),
   *
   * // app/team.tsx
   * export function loader({
   *   params,
   * }: Route.LoaderArgs) {
   *   params.teamId;
   *   //        ^ string
   * }
   */
  params: Params;
  /**
   * This is the context passed in to your server adapter's getLoadContext() function.
   * It's a way to bridge the gap between the adapter's request/response API with your React Router app.
   * It is only applicable if you are using a custom server adapter.
   */
  context: Context;
}
/**
 * Route middleware `next` function to call downstream handlers and then complete
 * middlewares from the bottom-up
 */
interface MiddlewareNextFunction<Result = unknown> {
  (): Promise<Result>;
}
/**
 * Route middleware function signature.  Receives the same "data" arguments as a
 * `loader`/`action` (`request`, `params`, `context`) as the first parameter and
 * a `next` function as the second parameter which will call downstream handlers
 * and then complete middlewares from the bottom-up
 */
type MiddlewareFunction<Result = unknown> = (args: DataFunctionArgs<Readonly<RouterContextProvider>>, next: MiddlewareNextFunction<Result>) => MaybePromise<Result | void>;
/**
 * Arguments passed to loader functions
 */
interface LoaderFunctionArgs<Context = DefaultContext> extends DataFunctionArgs<Context> {}
/**
 * Arguments passed to action functions
 */
interface ActionFunctionArgs<Context = DefaultContext> extends DataFunctionArgs<Context> {}
/**
 * Loaders and actions can return anything
 */
type DataFunctionValue = unknown;
type DataFunctionReturnValue = MaybePromise<DataFunctionValue>;
/**
 * Route loader function signature
 */
type LoaderFunction<Context = DefaultContext> = {
  (args: LoaderFunctionArgs<Context>, handlerCtx?: unknown): DataFunctionReturnValue;
} & {
  hydrate?: boolean;
};
/**
 * Route action function signature
 */
interface ActionFunction<Context = DefaultContext> {
  (args: ActionFunctionArgs<Context>, handlerCtx?: unknown): DataFunctionReturnValue;
}
/**
 * Arguments passed to shouldRevalidate function
 */
interface ShouldRevalidateFunctionArgs {
  /** This is the url the navigation started from. You can compare it with `nextUrl` to decide if you need to revalidate this route's data. */
  currentUrl: URL;
  /** These are the {@link https://reactrouter.com/start/framework/routing#dynamic-segments dynamic route params} from the URL that can be compared to the `nextParams` to decide if you need to reload or not. Perhaps you're using only a partial piece of the param for data loading, you don't need to revalidate if a superfluous part of the param changed. */
  currentParams: DataRouteMatch["params"];
  /** In the case of navigation, this the URL the user is requesting. Some revalidations are not navigation, so it will simply be the same as currentUrl. */
  nextUrl: URL;
  /** In the case of navigation, these are the {@link https://reactrouter.com/start/framework/routing#dynamic-segments dynamic route params}  from the next location the user is requesting. Some revalidations are not navigation, so it will simply be the same as currentParams. */
  nextParams: DataRouteMatch["params"];
  /** The method (probably `"GET"` or `"POST"`) used in the form submission that triggered the revalidation. */
  formMethod?: Submission["formMethod"];
  /** The form action (`<Form action="/somewhere">`) that triggered the revalidation. */
  formAction?: Submission["formAction"];
  /** The form encType (`<Form encType="application/x-www-form-urlencoded">) used in the form submission that triggered the revalidation*/
  formEncType?: Submission["formEncType"];
  /** The form submission data when the form's encType is `text/plain` */
  text?: Submission["text"];
  /** The form submission data when the form's encType is `application/x-www-form-urlencoded` or `multipart/form-data` */
  formData?: Submission["formData"];
  /** The form submission data when the form's encType is `application/json` */
  json?: Submission["json"];
  /** The status code of the action response */
  actionStatus?: number;
  /**
   * When a submission causes the revalidation this will be the result of the action—either action data or an error if the action failed. It's common to include some information in the action result to instruct shouldRevalidate to revalidate or not.
   *
   * @example
   * export async function action() {
   *   await saveSomeStuff();
   *   return { ok: true };
   * }
   *
   * export function shouldRevalidate({
   *   actionResult,
   * }) {
   *   if (actionResult?.ok) {
   *     return false;
   *   }
   *   return true;
   * }
   */
  actionResult?: any;
  /**
   * By default, React Router doesn't call every loader all the time. There are reliable optimizations it can make by default. For example, only loaders with changing params are called. Consider navigating from the following URL to the one below it:
   *
   * /projects/123/tasks/abc
   * /projects/123/tasks/def
   * React Router will only call the loader for tasks/def because the param for projects/123 didn't change.
   *
   * It's safest to always return defaultShouldRevalidate after you've done your specific optimizations that return false, otherwise your UI might get out of sync with your data on the server.
   */
  defaultShouldRevalidate: boolean;
}
/**
 * Route shouldRevalidate function signature.  This runs after any submission
 * (navigation or fetcher), so we flatten the navigation/fetcher submission
 * onto the arguments.  It shouldn't matter whether it came from a navigation
 * or a fetcher, what really matters is the URLs and the formData since loaders
 * have to re-run based on the data models that were potentially mutated.
 */
interface ShouldRevalidateFunction {
  (args: ShouldRevalidateFunctionArgs): boolean;
}
interface DataStrategyMatch extends RouteMatch<string, DataRouteObject> {
  /**
   * @private
   */
  _lazyPromises?: {
    middleware: Promise<void> | undefined;
    handler: Promise<void> | undefined;
    route: Promise<void> | undefined;
  };
  /**
   * @deprecated Deprecated in favor of `shouldCallHandler`
   *
   * A boolean value indicating whether this route handler should be called in
   * this pass.
   *
   * The `matches` array always includes _all_ matched routes even when only
   * _some_ route handlers need to be called so that things like middleware can
   * be implemented.
   *
   * `shouldLoad` is usually only interesting if you are skipping the route
   * handler entirely and implementing custom handler logic - since it lets you
   * determine if that custom logic should run for this route or not.
   *
   * For example:
   *  - If you are on `/parent/child/a` and you navigate to `/parent/child/b` -
   *    you'll get an array of three matches (`[parent, child, b]`), but only `b`
   *    will have `shouldLoad=true` because the data for `parent` and `child` is
   *    already loaded
   *  - If you are on `/parent/child/a` and you submit to `a`'s [`action`](https://reactrouter.com/docs/start/data/route-object#action),
   *    then only `a` will have `shouldLoad=true` for the action execution of
   *    `dataStrategy`
   *  - After the [`action`](https://reactrouter.com/docs/start/data/route-object#action),
   *    `dataStrategy` will be called again for the [`loader`](https://reactrouter.com/docs/start/data/route-object#loader)
   *    revalidation, and all matches will have `shouldLoad=true` (assuming no
   *    custom `shouldRevalidate` implementations)
   */
  shouldLoad: boolean;
  /**
   * Arguments passed to the `shouldRevalidate` function for this `loader` execution.
   * Will be `null` if this is not a revalidating loader {@link DataStrategyMatch}.
   */
  shouldRevalidateArgs: ShouldRevalidateFunctionArgs | null;
  /**
   * Determine if this route's handler should be called during this `dataStrategy`
   * execution. Calling it with no arguments will leverage the default revalidation
   * behavior. You can pass your own `defaultShouldRevalidate` value if you wish
   * to change the default revalidation behavior with your `dataStrategy`.
   *
   * @param defaultShouldRevalidate `defaultShouldRevalidate` override value (optional)
   */
  shouldCallHandler(defaultShouldRevalidate?: boolean): boolean;
  /**
   * An async function that will resolve any `route.lazy` implementations and
   * execute the route's handler (if necessary), returning a {@link DataStrategyResult}
   *
   * - Calling `match.resolve` does not mean you're calling the
   *   [`action`](https://reactrouter.com/docs/start/data/route-object#action)/[`loader`](https://reactrouter.com/docs/start/data/route-object#loader)
   *   (the "handler") - `resolve` will only call the `handler` internally if
   *   needed _and_ if you don't pass your own `handlerOverride` function parameter
   * - It is safe to call `match.resolve` for all matches, even if they have
   *   `shouldLoad=false`, and it will no-op if no loading is required
   * - You should generally always call `match.resolve()` for `shouldLoad:true`
   *   routes to ensure that any `route.lazy` implementations are processed
   * - See the examples below for how to implement custom handler execution via
   *   `match.resolve`
   */
  resolve: (handlerOverride?: (handler: (ctx?: unknown) => DataFunctionReturnValue) => DataFunctionReturnValue) => Promise<DataStrategyResult>;
}
interface DataStrategyFunctionArgs<Context = DefaultContext> extends DataFunctionArgs<Context> {
  /**
   * Matches for this route extended with Data strategy APIs
   */
  matches: DataStrategyMatch[];
  runClientMiddleware: (cb: DataStrategyFunction<Context>) => Promise<Record<string, DataStrategyResult>>;
  /**
   * The key of the fetcher we are calling `dataStrategy` for, otherwise `null`
   * for navigational executions
   */
  fetcherKey: string | null;
}
/**
 * Result from a loader or action called via dataStrategy
 */
interface DataStrategyResult {
  type: "data" | "error";
  result: unknown;
}
interface DataStrategyFunction<Context = DefaultContext> {
  (args: DataStrategyFunctionArgs<Context>): Promise<Record<string, DataStrategyResult>>;
}
type PatchRoutesOnNavigationFunctionArgs = {
  signal: AbortSignal;
  path: string;
  matches: RouteMatch[];
  fetcherKey: string | undefined;
  patch: (routeId: string | null, children: RouteObject[]) => void;
};
type PatchRoutesOnNavigationFunction = (opts: PatchRoutesOnNavigationFunctionArgs) => MaybePromise<void>;
/**
 * Function provided to set route-specific properties from route objects
 */
interface MapRoutePropertiesFunction {
  (route: DataRouteObject): Partial<DataRouteObject>;
}
/**
 * Keys we cannot change from within a lazy object. We spread all other keys
 * onto the route. Either they're meaningful to the router, or they'll get
 * ignored.
 */
type UnsupportedLazyRouteObjectKey = "lazy" | "caseSensitive" | "path" | "id" | "index" | "children";
/**
 * Keys we cannot change from within a lazy() function. We spread all other keys
 * onto the route. Either they're meaningful to the router, or they'll get
 * ignored.
 */
type UnsupportedLazyRouteFunctionKey = UnsupportedLazyRouteObjectKey | "middleware";
/**
 * lazy object to load route properties, which can add non-matching
 * related properties to a route
 */
type LazyRouteObject<R extends RouteObject> = { [K in keyof R as K extends UnsupportedLazyRouteObjectKey ? never : K]?: () => Promise<R[K] | null | undefined> };
/**
 * lazy() function to load a route definition, which can add non-matching
 * related properties to a route
 */
interface LazyRouteFunction<R extends RouteObject> {
  (): Promise<Omit<R, UnsupportedLazyRouteFunctionKey> & Partial<Record<UnsupportedLazyRouteFunctionKey, never>>>;
}
type LazyRouteDefinition<R extends RouteObject> = LazyRouteObject<R> | LazyRouteFunction<R>;
/**
 * Base RouteObject with common props shared by all types of routes
 * @internal
 */
type BaseRouteObject = {
  /**
   * Whether the path should be case-sensitive. Defaults to `false`.
   */
  caseSensitive?: boolean;
  /**
   * The path pattern to match. If unspecified or empty, then this becomes a
   * layout route.
   */
  path?: string;
  /**
   * The unique identifier for this route (for use with {@link DataRouter}s)
   */
  id?: string;
  /**
   * The route middleware.
   * See [`middleware`](../../start/data/route-object#middleware).
   */
  middleware?: MiddlewareFunction[];
  /**
   * The route loader.
   * See [`loader`](../../start/data/route-object#loader).
   */
  loader?: LoaderFunction | boolean;
  /**
   * The route action.
   * See [`action`](../../start/data/route-object#action).
   */
  action?: ActionFunction | boolean;
  /**
   * The route shouldRevalidate function.
   * See [`shouldRevalidate`](../../start/data/route-object#shouldRevalidate).
   */
  shouldRevalidate?: ShouldRevalidateFunction;
  /**
   * The route handle.
   */
  handle?: any;
  /**
   * A function that returns a promise that resolves to the route object.
   * Used for code-splitting routes.
   * See [`lazy`](../../start/data/route-object#lazy).
   */
  lazy?: LazyRouteDefinition<BaseRouteObject>;
  /**
   * The React Component to render when this route matches.
   * Mutually exclusive with `element`.
   */
  Component?: React$1.ComponentType | null;
  /**
   * The React element to render when this Route matches.
   * Mutually exclusive with `Component`.
   */
  element?: React$1.ReactNode | null;
  /**
   * The React Component to render at this route if an error occurs.
   * Mutually exclusive with `errorElement`.
   */
  ErrorBoundary?: React$1.ComponentType | null;
  /**
   * The React element to render at this route if an error occurs.
   * Mutually exclusive with `ErrorBoundary`.
   */
  errorElement?: React$1.ReactNode | null;
  /**
   * The React Component to render while this router is loading data.
   * Mutually exclusive with `hydrateFallbackElement`.
   */
  HydrateFallback?: React$1.ComponentType | null;
  /**
   * The React element to render while this router is loading data.
   * Mutually exclusive with `HydrateFallback`.
   */
  hydrateFallbackElement?: React$1.ReactNode | null;
};
/**
 * Index routes must not have children
 */
type IndexRouteObject = BaseRouteObject & {
  /**
   * Child Route objects - not valid on index routes.
   */
  children?: undefined;
  /**
   * Whether this is an index route.
   */
  index: true;
};
/**
 * Non-index routes may have children, but cannot have `index` set to `true`.
 */
type NonIndexRouteObject = BaseRouteObject & {
  /**
   * Child Route objects.
   */
  children?: RouteObject[];
  /**
   * Whether this is an index route - must be `false` or undefined on non-index routes.
   */
  index?: false;
};
/**
 * A route object represents a logical route, with (optionally) its child
 * routes organized in a tree-like structure.
 */
type RouteObject = IndexRouteObject | NonIndexRouteObject;
type DataIndexRouteObject = IndexRouteObject & {
  id: string;
};
type DataNonIndexRouteObject = NonIndexRouteObject & {
  children?: DataRouteObject[];
  id: string;
};
/**
 * A data route object, which is just a RouteObject with a required unique ID
 */
type DataRouteObject = DataIndexRouteObject | DataNonIndexRouteObject;
type RouteManifest<R = DataRouteObject> = Record<string, R | undefined>;
type Regex_az = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z";
type Regex_AZ = Uppercase<Regex_az>;
type Regex_09 = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type Regex_w = Regex_az | Regex_AZ | Regex_09 | "_";
/** Emulates Regex `+` operator */
type RegexMatchPlus<char extends string, T extends string> = _RegexMatchPlus<char, T> extends infer result extends string ? result extends '' ? never : result : never;
type _RegexMatchPlus<char extends string, T extends string> = T extends `${infer head extends char}${infer rest}` ? `${head}${_RegexMatchPlus<char, rest>}` : '';
type ParamNameChar = Regex_w | "-";
type Simplify<T> = { [K in keyof T]: T[K] } & {};
type GeneratePathParams<path extends string> = Simplify<ParseParams<path> & { [key in string]: string | null | undefined }>;
type ParseParams<path extends string> = path extends '*' ? {
  '*': string;
} : path extends `${infer rest}/*` ? {
  '*': string;
} & ParseParams<rest> : _ParseParams<path>;
type _ParseParams<path extends string> = path extends `${infer left}/${infer right}` ? _ParseParams<left> & _ParseParams<right> : path extends `:${infer param}?${string}` ? { [key in RegexMatchPlus<ParamNameChar, param>]?: string | null | undefined } : path extends `:${infer param}` ? { [key in RegexMatchPlus<ParamNameChar, param>]: string } : {};
type PathParam<path extends string> = (keyof ParseParams<path>) & string;
type ParamParseKey<Segment extends string> = [PathParam<Segment>] extends [never] ? string : PathParam<Segment>;
/**
 * The parameters that were parsed from the URL path.
 */
type Params<Key extends string = string> = { readonly [key in Key]: string | undefined };
/**
 * A RouteMatch contains info about how a route matched a URL.
 */
interface RouteMatch<ParamKey extends string = string, RouteObjectType extends RouteObject = RouteObject> {
  /**
   * The names and values of dynamic parameters in the URL.
   */
  params: Params<ParamKey>;
  /**
   * The portion of the URL pathname that was matched.
   */
  pathname: string;
  /**
   * The portion of the URL pathname that was matched before child routes.
   */
  pathnameBase: string;
  /**
   * The route object that was used to match.
   */
  route: RouteObjectType;
}
interface DataRouteMatch extends RouteMatch<string, DataRouteObject> {}
declare function defaultMapRouteProperties(route: DataRouteObject): Partial<DataRouteObject>;
/**
 * Matches the given routes to a location and returns the match data.
 *
 * @example
 * import { matchRoutes } from "react-router";
 *
 * let routes = [{
 *   path: "/",
 *   Component: Root,
 *   children: [{
 *     path: "dashboard",
 *     Component: Dashboard,
 *   }]
 * }];
 *
 * matchRoutes(routes, "/dashboard"); // [rootMatch, dashboardMatch]
 *
 * @public
 * @category Utils
 * @param routes The array of route objects to match against.
 * @param locationArg The location to match against, either a string path or a
 * partial {@link Location} object
 * @param basename Optional base path to strip from the location before matching.
 * Defaults to `/`.
 * @returns An array of matched routes, or `null` if no matches were found.
 */
declare function matchRoutes<RouteObjectType extends RouteObject = RouteObject>(routes: RouteObjectType[], locationArg: Partial<Location> | string, basename?: string): RouteMatch<string, RouteObjectType>[] | null;
interface UIMatch<Data = unknown, Handle = unknown> {
  id: string;
  pathname: string;
  /**
   * {@link https://reactrouter.com/start/framework/routing#dynamic-segments Dynamic route params} for the matched route.
   */
  params: RouteMatch["params"];
  /**
   * The return value from the matched route's loader or clientLoader. This might
   * be `undefined` if this route's `loader` (or a deeper route's `loader`) threw
   * an error and we're currently displaying an `ErrorBoundary`.
   */
  loaderData: Data | undefined;
  /**
   * The {@link https://reactrouter.com/start/framework/route-module#handle handle object}
   * exported from the matched route module
   */
  handle: Handle;
}
interface RouteMeta<RouteObjectType extends RouteObject = RouteObject> {
  relativePath: string;
  caseSensitive: boolean;
  childrenIndex: number;
  route: RouteObjectType;
  matcher?: RegExp;
  compiledParams?: CompiledPathParam[];
}
/**
 * @private
 * PRIVATE - DO NOT USE
 *
 * A "branch" of routes that match a given route pattern.
 * This is an internal interface not intended for direct external usage.
 */
interface RouteBranch<RouteObjectType extends RouteObject = RouteObject> {
  path: string;
  score: number;
  routesMeta: RouteMeta<RouteObjectType>[];
}
/**
 * Returns a path with params interpolated.
 *
 * @example
 * import { generatePath } from "react-router";
 *
 * generatePath("/users/:id", { id: "123" }); // "/users/123"
 *
 * @public
 * @category Utils
 * @param originalPath The original path to generate.
 * @param params The parameters to interpolate into the path.
 * @returns The generated path with parameters interpolated.
 */
declare function generatePath<Path extends string>(originalPath: Path, params?: GeneratePathParams<Path>): string;
/**
 * Used to match on some portion of a URL pathname.
 */
interface PathPattern<Path extends string = string> {
  /**
   * A string to match against a URL pathname. May contain `:id`-style segments
   * to indicate placeholders for dynamic parameters. It May also end with `/*`
   * to indicate matching the rest of the URL pathname.
   */
  path: Path;
  /**
   * Should be `true` if the static portions of the `path` should be matched in
   * the same case.
   */
  caseSensitive?: boolean;
  /**
   * Should be `true` if this pattern should match the entire URL pathname.
   */
  end?: boolean;
}
/**
 * Contains info about how a {@link PathPattern} matched on a URL pathname.
 */
interface PathMatch<ParamKey extends string = string> {
  /**
   * The names and values of dynamic parameters in the URL.
   */
  params: Params<ParamKey>;
  /**
   * The portion of the URL pathname that was matched.
   */
  pathname: string;
  /**
   * The portion of the URL pathname that was matched before child routes.
   */
  pathnameBase: string;
  /**
   * The pattern that was used to match.
   */
  pattern: PathPattern;
}
/**
 * Performs pattern matching on a URL pathname and returns information about
 * the match.
 *
 * @public
 * @category Utils
 * @param pattern The pattern to match against the URL pathname. This can be a
 * string or a {@link PathPattern} object. If a string is provided, it will be
 * treated as a pattern with `caseSensitive` set to `false` and `end` set to
 * `true`.
 * @param pathname The URL pathname to match against the pattern.
 * @returns A path match object if the pattern matches the pathname,
 * or `null` if it does not match.
 */
declare function matchPath<Path extends string>(pattern: PathPattern<Path> | Path, pathname: string): PathMatch<ParamParseKey<Path>> | null;
type CompiledPathParam = {
  paramName: string;
  isOptional?: boolean;
};
/**
 * Returns a resolved {@link Path} object relative to the given pathname.
 *
 * @public
 * @category Utils
 * @param to The path to resolve, either a string or a partial {@link Path}
 * object.
 * @param fromPathname The pathname to resolve the path from. Defaults to `/`.
 * @returns A {@link Path} object with the resolved pathname, search, and hash.
 */
declare function resolvePath(to: To, fromPathname?: string): Path;
declare class DataWithResponseInit<D> {
  type: string;
  data: D;
  init: ResponseInit | null;
  constructor(data: D, init?: ResponseInit);
}
/**
 * Create "responses" that contain `headers`/`status` without forcing
 * serialization into an actual [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 *
 * @example
 * import { data } from "react-router";
 *
 * export async function action({ request }: Route.ActionArgs) {
 *   let formData = await request.formData();
 *   let item = await createItem(formData);
 *   return data(item, {
 *     headers: { "X-Custom-Header": "value" }
 *     status: 201,
 *   });
 * }
 *
 * @public
 * @category Utils
 * @mode framework
 * @mode data
 * @param data The data to be included in the response.
 * @param init The status code or a `ResponseInit` object to be included in the
 * response.
 * @returns A {@link DataWithResponseInit} instance containing the data and
 * response init.
 */
declare function data<D>(data: D, init?: number | ResponseInit): DataWithResponseInit<D>;
interface TrackedPromise extends Promise<any> {
  _tracked?: boolean;
  _data?: any;
  _error?: any;
}
type RedirectFunction = (url: string, init?: number | ResponseInit) => Response;
/**
 * A redirect [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response).
 * Sets the status code and the [`Location`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location)
 * header. Defaults to [`302 Found`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302).
 *
 * This utility accepts absolute URLs and can navigate to external domains, so
 * the application should validate any user-supplied inputs to redirects.
 *
 * @example
 * import { redirect } from "react-router";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 *   if (!isLoggedIn(request))
 *     throw redirect("/login");
 *   }
 *
 *   // ...
 * }
 *
 * @public
 * @category Utils
 * @mode framework
 * @mode data
 * @param url The URL to redirect to.
 * @param init The status code or a `ResponseInit` object to be included in the
 * response.
 * @returns A [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * object with the redirect status and [`Location`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location)
 * header.
 */
declare const redirect: RedirectFunction;
/**
 * A redirect [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * that will force a document reload to the new location. Sets the status code
 * and the [`Location`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location)
 * header. Defaults to [`302 Found`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302).
 *
 * This utility accepts absolute URLs and can navigate to external domains, so
 * the application should validate any user-supplied inputs to redirects.
 *
 * ```tsx filename=routes/logout.tsx
 * import { redirectDocument } from "react-router";
 *
 * import { destroySession } from "../sessions.server";
 *
 * export async function action({ request }: Route.ActionArgs) {
 *   let session = await getSession(request.headers.get("Cookie"));
 *   return redirectDocument("/", {
 *     headers: { "Set-Cookie": await destroySession(session) }
 *   });
 * }
 * ```
 *
 * @public
 * @category Utils
 * @mode framework
 * @mode data
 * @param url The URL to redirect to.
 * @param init The status code or a `ResponseInit` object to be included in the
 * response.
 * @returns A [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * object with the redirect status and [`Location`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location)
 * header.
 */
declare const redirectDocument: RedirectFunction;
/**
 * A redirect [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * that will perform a [`history.replaceState`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState)
 * instead of a [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)
 * for client-side navigation redirects. Sets the status code and the [`Location`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location)
 * header. Defaults to [`302 Found`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302).
 *
 * @example
 * import { replace } from "react-router";
 *
 * export async function loader() {
 *   return replace("/new-location");
 * }
 *
 * @public
 * @category Utils
 * @mode framework
 * @mode data
 * @param url The URL to redirect to.
 * @param init The status code or a `ResponseInit` object to be included in the
 * response.
 * @returns A [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * object with the redirect status and [`Location`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location)
 * header.
 */
declare const replace: RedirectFunction;
type ErrorResponse = {
  status: number;
  statusText: string;
  data: any;
};
declare class ErrorResponseImpl implements ErrorResponse {
  status: number;
  statusText: string;
  data: any;
  private error?;
  private internal;
  constructor(status: number, statusText: string | undefined, data: any, internal?: boolean);
}
/**
 * Check if the given error is an {@link ErrorResponse} generated from a 4xx/5xx
 * [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * thrown from an [`action`](../../start/framework/route-module#action) or
 * [`loader`](../../start/framework/route-module#loader) function.
 *
 * @example
 * import { isRouteErrorResponse } from "react-router";
 *
 * export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
 *   if (isRouteErrorResponse(error)) {
 *     return (
 *       <>
 *         <p>Error: `${error.status}: ${error.statusText}`</p>
 *         <p>{error.data}</p>
 *       </>
 *     );
 *   }
 *
 *   return (
 *     <p>Error: {error instanceof Error ? error.message : "Unknown Error"}</p>
 *   );
 * }
 *
 * @public
 * @category Utils
 * @mode framework
 * @mode data
 * @param error The error to check.
 * @returns `true` if the error is an {@link ErrorResponse}, `false` otherwise.
 */
declare function isRouteErrorResponse(error: any): error is ErrorResponse;
//#endregion
export { ActionFunction, ActionFunctionArgs, BaseRouteObject, DataRouteMatch, DataRouteObject, DataStrategyFunction, DataStrategyFunctionArgs, DataStrategyMatch, DataStrategyResult, DataWithResponseInit, ErrorResponse, ErrorResponseImpl, FormEncType, FormMethod, HTMLFormMethod, IndexRouteObject, LazyRouteFunction, LoaderFunction, LoaderFunctionArgs, MapRoutePropertiesFunction, MaybePromise, MiddlewareFunction, MiddlewareNextFunction, NonIndexRouteObject, ParamParseKey, Params, PatchRoutesOnNavigationFunction, PatchRoutesOnNavigationFunctionArgs, PathMatch, PathParam, PathPattern, RedirectFunction, RouteBranch, RouteData, RouteManifest, RouteMatch, RouteObject, RouterContext, RouterContextProvider, ShouldRevalidateFunction, ShouldRevalidateFunctionArgs, Submission, TrackedPromise, UIMatch, createContext, data, defaultMapRouteProperties, generatePath, isRouteErrorResponse, matchPath, matchRoutes, redirect, redirectDocument, replace, resolvePath };