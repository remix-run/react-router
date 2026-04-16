import * as React from 'react';
export { BrowserRouter, Form, HashRouter, Link, Links, MemoryRouter, Meta, NavLink, Navigate, Outlet, Route, Router, RouterProvider, Routes, ScrollRestoration, StaticRouter, StaticRouterProvider, unstable_HistoryRouter } from 'react-router/internal/react-server-client';
import { ParseOptions, SerializeOptions } from 'cookie';
export { ParseOptions as CookieParseOptions, SerializeOptions as CookieSerializeOptions } from 'cookie';

/**
 * Actions represent the type of change to a location value.
 */
declare enum Action {
    /**
     * A POP indicates a change to an arbitrary index in the history stack, such
     * as a back or forward navigation. It does not describe the direction of the
     * navigation, only that the current index changed.
     *
     * Note: This is the default action for newly created history objects.
     */
    Pop = "POP",
    /**
     * A PUSH indicates a new entry being added to the history stack, such as when
     * a link is clicked and a new page loads. When this happens, all subsequent
     * entries in the stack are lost.
     */
    Push = "PUSH",
    /**
     * A REPLACE indicates the entry at the current index in the history stack
     * being replaced by a new one.
     */
    Replace = "REPLACE"
}
/**
 * The pathname, search, and hash values of a URL.
 */
interface Path {
    /**
     * A URL pathname, beginning with a /.
     */
    pathname: string;
    /**
     * A URL search string, beginning with a ?.
     */
    search: string;
    /**
     * A URL fragment identifier, beginning with a #.
     */
    hash: string;
}
/**
 * An entry in a history stack. A location contains information about the
 * URL path, as well as possibly some arbitrary state and a key.
 */
interface Location<State = any> extends Path {
    /**
     * A value of arbitrary data associated with this location.
     */
    state: State;
    /**
     * A unique string associated with this location. May be used to safely store
     * and retrieve data in some other storage API, like `localStorage`.
     *
     * Note: This value is always "default" on the initial location.
     */
    key: string;
    /**
     * The masked location displayed in the URL bar, which differs from the URL the
     * router is operating on
     */
    unstable_mask: Path | undefined;
}
/**
 * A change to the current location.
 */
interface Update {
    /**
     * The action that triggered the change.
     */
    action: Action;
    /**
     * The new location.
     */
    location: Location;
    /**
     * The delta between this location and the former location in the history stack
     */
    delta: number | null;
}
/**
 * A function that receives notifications about location changes.
 */
interface Listener {
    (update: Update): void;
}
/**
 * Describes a location that is the destination of some navigation used in
 * {@link Link}, {@link useNavigate}, etc.
 */
type To = string | Partial<Path>;
/**
 * A history is an interface to the navigation stack. The history serves as the
 * source of truth for the current location, as well as provides a set of
 * methods that may be used to change it.
 *
 * It is similar to the DOM's `window.history` object, but with a smaller, more
 * focused API.
 */
interface History {
    /**
     * The last action that modified the current location. This will always be
     * Action.Pop when a history instance is first created. This value is mutable.
     */
    readonly action: Action;
    /**
     * The current location. This value is mutable.
     */
    readonly location: Location;
    /**
     * Returns a valid href for the given `to` value that may be used as
     * the value of an <a href> attribute.
     *
     * @param to - The destination URL
     */
    createHref(to: To): string;
    /**
     * Returns a URL for the given `to` value
     *
     * @param to - The destination URL
     */
    createURL(to: To): URL;
    /**
     * Encode a location the same way window.history would do (no-op for memory
     * history) so we ensure our PUSH/REPLACE navigations for data routers
     * behave the same as POP
     *
     * @param to Unencoded path
     */
    encodeLocation(to: To): Path;
    /**
     * Pushes a new location onto the history stack, increasing its length by one.
     * If there were any entries in the stack after the current one, they are
     * lost.
     *
     * @param to - The new URL
     * @param state - Data to associate with the new location
     */
    push(to: To, state?: any): void;
    /**
     * Replaces the current location in the history stack with a new one.  The
     * location that was replaced will no longer be available.
     *
     * @param to - The new URL
     * @param state - Data to associate with the new location
     */
    replace(to: To, state?: any): void;
    /**
     * Navigates `n` entries backward/forward in the history stack relative to the
     * current index. For example, a "back" navigation would use go(-1).
     *
     * @param delta - The delta in the stack index
     */
    go(delta: number): void;
    /**
     * Sets up a listener that will be called whenever the current location
     * changes.
     *
     * @param listener - A function that will be called when the location changes
     * @returns unlisten - A function that may be used to stop listening
     */
    listen(listener: Listener): () => void;
}

/**
 * An augmentable interface users can modify in their app-code to opt into
 * future-flag-specific types
 */
interface Future {
}
type MiddlewareEnabled = Future extends {
    v8_middleware: infer T extends boolean;
} ? T : false;

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
type JsonObject = {
    [Key in string]: JsonValue;
} & {
    [Key in string]?: JsonValue | undefined;
};
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
type DefaultContext = MiddlewareEnabled extends true ? Readonly<RouterContextProvider> : any;
/**
 * @private
 * Arguments passed to route loader/action functions.  Same for now but we keep
 * this as a private implementation detail in case they diverge in the future.
 */
interface DataFunctionArgs<Context> {
    /** A {@link https://developer.mozilla.org/en-US/docs/Web/API/Request Fetch Request instance} which you can use to read headers (like cookies, and {@link https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams URLSearchParams} from the request. */
    request: Request;
    /**
     * A URL instance representing the application location being navigated to or fetched.
     * Without `future.unstable_passThroughRequests` enabled, this matches `request.url`.
     * With `future.unstable_passThroughRequests` enabled, this is a normalized
     * URL with React-Router-specific implementation details removed (`.data`
     * suffixes, `index`/`_routes` search params).
     * The URL includes the origin from the request for convenience.
     */
    unstable_url: URL;
    /**
     * Matched un-interpolated route pattern for the current path (i.e., /blog/:slug).
     * Mostly useful as a identifier to aggregate on for logging/tracing/etc.
     */
    unstable_pattern: string;
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
interface LoaderFunctionArgs<Context = DefaultContext> extends DataFunctionArgs<Context> {
}
/**
 * Arguments passed to action functions
 */
interface ActionFunctionArgs<Context = DefaultContext> extends DataFunctionArgs<Context> {
}
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
    (route: DataRouteObject): {
        hasErrorBoundary: boolean;
    } & Record<string, any>;
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
type LazyRouteObject<R extends RouteObject> = {
    [K in keyof R as K extends UnsupportedLazyRouteObjectKey ? never : K]?: () => Promise<R[K] | null | undefined>;
};
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
    hasErrorBoundary?: boolean;
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
    Component?: React.ComponentType | null;
    /**
     * The React element to render when this Route matches.
     * Mutually exclusive with `Component`.
     */
    element?: React.ReactNode | null;
    /**
     * The React Component to render at this route if an error occurs.
     * Mutually exclusive with `errorElement`.
     */
    ErrorBoundary?: React.ComponentType | null;
    /**
     * The React element to render at this route if an error occurs.
     * Mutually exclusive with `ErrorBoundary`.
     */
    errorElement?: React.ReactNode | null;
    /**
     * The React Component to render while this router is loading data.
     * Mutually exclusive with `hydrateFallbackElement`.
     */
    HydrateFallback?: React.ComponentType | null;
    /**
     * The React element to render while this router is loading data.
     * Mutually exclusive with `HydrateFallback`.
     */
    hydrateFallbackElement?: React.ReactNode | null;
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
/**
 * The parameters that were parsed from the URL path.
 */
type Params<Key extends string = string> = {
    readonly [key in Key]: string | undefined;
};
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
interface DataRouteMatch extends RouteMatch<string, DataRouteObject> {
}
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
     *
     * @deprecated Use `UIMatch.loaderData` instead
     */
    data: Data | undefined;
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
declare const redirect$1: RedirectFunction;
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
declare const redirectDocument$1: RedirectFunction;
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
declare const replace$1: RedirectFunction;
type ErrorResponse = {
    status: number;
    statusText: string;
    data: any;
};
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

/**
 * An object of unknown type for route loaders and actions provided by the
 * server's `getLoadContext()` function.  This is defined as an empty interface
 * specifically so apps can leverage declaration merging to augment this type
 * globally: https://www.typescriptlang.org/docs/handbook/declaration-merging.html
 */
interface AppLoadContext {
    [key: string]: unknown;
}

type unstable_ServerInstrumentation = {
    handler?: unstable_InstrumentRequestHandlerFunction;
    route?: unstable_InstrumentRouteFunction;
};
type unstable_ClientInstrumentation = {
    router?: unstable_InstrumentRouterFunction;
    route?: unstable_InstrumentRouteFunction;
};
type unstable_InstrumentRequestHandlerFunction = (handler: InstrumentableRequestHandler) => void;
type unstable_InstrumentRouterFunction = (router: InstrumentableRouter) => void;
type unstable_InstrumentRouteFunction = (route: InstrumentableRoute) => void;
type unstable_InstrumentationHandlerResult = {
    status: "success";
    error: undefined;
} | {
    status: "error";
    error: Error;
};
type InstrumentFunction<T> = (handler: () => Promise<unstable_InstrumentationHandlerResult>, info: T) => Promise<void>;
type ReadonlyRequest = {
    method: string;
    url: string;
    headers: Pick<Headers, "get">;
};
type ReadonlyContext = MiddlewareEnabled extends true ? Pick<RouterContextProvider, "get"> : Readonly<AppLoadContext>;
type InstrumentableRoute = {
    id: string;
    index: boolean | undefined;
    path: string | undefined;
    instrument(instrumentations: RouteInstrumentations): void;
};
type RouteInstrumentations = {
    lazy?: InstrumentFunction<RouteLazyInstrumentationInfo>;
    "lazy.loader"?: InstrumentFunction<RouteLazyInstrumentationInfo>;
    "lazy.action"?: InstrumentFunction<RouteLazyInstrumentationInfo>;
    "lazy.middleware"?: InstrumentFunction<RouteLazyInstrumentationInfo>;
    middleware?: InstrumentFunction<RouteHandlerInstrumentationInfo>;
    loader?: InstrumentFunction<RouteHandlerInstrumentationInfo>;
    action?: InstrumentFunction<RouteHandlerInstrumentationInfo>;
};
type RouteLazyInstrumentationInfo = undefined;
type RouteHandlerInstrumentationInfo = Readonly<{
    request: ReadonlyRequest;
    params: LoaderFunctionArgs["params"];
    unstable_pattern: string;
    context: ReadonlyContext;
}>;
type InstrumentableRouter = {
    instrument(instrumentations: RouterInstrumentations): void;
};
type RouterInstrumentations = {
    navigate?: InstrumentFunction<RouterNavigationInstrumentationInfo>;
    fetch?: InstrumentFunction<RouterFetchInstrumentationInfo>;
};
type RouterNavigationInstrumentationInfo = Readonly<{
    to: string | number;
    currentUrl: string;
    formMethod?: HTMLFormMethod;
    formEncType?: FormEncType;
    formData?: FormData;
    body?: any;
}>;
type RouterFetchInstrumentationInfo = Readonly<{
    href: string;
    currentUrl: string;
    fetcherKey: string;
    formMethod?: HTMLFormMethod;
    formEncType?: FormEncType;
    formData?: FormData;
    body?: any;
}>;
type InstrumentableRequestHandler = {
    instrument(instrumentations: RequestHandlerInstrumentations): void;
};
type RequestHandlerInstrumentations = {
    request?: InstrumentFunction<RequestHandlerInstrumentationInfo>;
};
type RequestHandlerInstrumentationInfo = Readonly<{
    request: ReadonlyRequest;
    context: ReadonlyContext | undefined;
}>;

/**
 * A Router instance manages all navigation and data loading/mutations
 */
interface Router {
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Return the basename for the router
     */
    get basename(): RouterInit["basename"];
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Return the future config for the router
     */
    get future(): FutureConfig;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Return the current state of the router
     */
    get state(): RouterState;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Return the routes for this router instance
     */
    get routes(): DataRouteObject[];
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Return the window associated with the router
     */
    get window(): RouterInit["window"];
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Initialize the router, including adding history listeners and kicking off
     * initial data fetches.  Returns a function to cleanup listeners and abort
     * any in-progress loads
     */
    initialize(): Router;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Subscribe to router.state updates
     *
     * @param fn function to call with the new state
     */
    subscribe(fn: RouterSubscriber): () => void;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Enable scroll restoration behavior in the router
     *
     * @param savedScrollPositions Object that will manage positions, in case
     *                             it's being restored from sessionStorage
     * @param getScrollPosition    Function to get the active Y scroll position
     * @param getKey               Function to get the key to use for restoration
     */
    enableScrollRestoration(savedScrollPositions: Record<string, number>, getScrollPosition: GetScrollPositionFunction, getKey?: GetScrollRestorationKeyFunction): () => void;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Navigate forward/backward in the history stack
     * @param to Delta to move in the history stack
     */
    navigate(to: number): Promise<void>;
    /**
     * Navigate to the given path
     * @param to Path to navigate to
     * @param opts Navigation options (method, submission, etc.)
     */
    navigate(to: To | null, opts?: RouterNavigateOptions): Promise<void>;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Trigger a fetcher load/submission
     *
     * @param key     Fetcher key
     * @param routeId Route that owns the fetcher
     * @param href    href to fetch
     * @param opts    Fetcher options, (method, submission, etc.)
     */
    fetch(key: string, routeId: string, href: string | null, opts?: RouterFetchOptions): Promise<void>;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Trigger a revalidation of all current route loaders and fetcher loads
     */
    revalidate(): Promise<void>;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Utility function to create an href for the given location
     * @param location
     */
    createHref(location: Location | URL): string;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Utility function to URL encode a destination path according to the internal
     * history implementation
     * @param to
     */
    encodeLocation(to: To): Path;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Get/create a fetcher for the given key
     * @param key
     */
    getFetcher<TData = any>(key: string): Fetcher<TData>;
    /**
     * @internal
     * PRIVATE - DO NOT USE
     *
     * Reset the fetcher for a given key
     * @param key
     */
    resetFetcher(key: string, opts?: {
        reason?: unknown;
    }): void;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Delete the fetcher for a given key
     * @param key
     */
    deleteFetcher(key: string): void;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Cleanup listeners and abort any in-progress loads
     */
    dispose(): void;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Get a navigation blocker
     * @param key The identifier for the blocker
     * @param fn The blocker function implementation
     */
    getBlocker(key: string, fn: BlockerFunction): Blocker;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Delete a navigation blocker
     * @param key The identifier for the blocker
     */
    deleteBlocker(key: string): void;
    /**
     * @private
     * PRIVATE DO NOT USE
     *
     * Patch additional children routes into an existing parent route
     * @param routeId The parent route id or a callback function accepting `patch`
     *                to perform batch patching
     * @param children The additional children routes
     * @param unstable_allowElementMutations Allow mutation or route elements on
     *                                       existing routes. Intended for RSC-usage
     *                                       only.
     */
    patchRoutes(routeId: string | null, children: RouteObject[], unstable_allowElementMutations?: boolean): void;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * HMR needs to pass in-flight route updates to React Router
     * TODO: Replace this with granular route update APIs (addRoute, updateRoute, deleteRoute)
     */
    _internalSetRoutes(routes: RouteObject[]): void;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Cause subscribers to re-render.  This is used to force a re-render.
     */
    _internalSetStateDoNotUseOrYouWillBreakYourApp(state: Partial<RouterState>): void;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Internal fetch AbortControllers accessed by unit tests
     */
    _internalFetchControllers: Map<string, AbortController>;
}
/**
 * State maintained internally by the router.  During a navigation, all states
 * reflect the "old" location unless otherwise noted.
 */
interface RouterState {
    /**
     * The action of the most recent navigation
     */
    historyAction: Action;
    /**
     * The current location reflected by the router
     */
    location: Location;
    /**
     * The current set of route matches
     */
    matches: DataRouteMatch[];
    /**
     * Tracks whether we've completed our initial data load
     */
    initialized: boolean;
    /**
     * Tracks whether we should be rendering a HydrateFallback during hydration
     */
    renderFallback: boolean;
    /**
     * Current scroll position we should start at for a new view
     *  - number -> scroll position to restore to
     *  - false -> do not restore scroll at all (used during submissions/revalidations)
     *  - null -> don't have a saved position, scroll to hash or top of page
     */
    restoreScrollPosition: number | false | null;
    /**
     * Indicate whether this navigation should skip resetting the scroll position
     * if we are unable to restore the scroll position
     */
    preventScrollReset: boolean;
    /**
     * Tracks the state of the current navigation
     */
    navigation: Navigation;
    /**
     * Tracks any in-progress revalidations
     */
    revalidation: RevalidationState;
    /**
     * Data from the loaders for the current matches
     */
    loaderData: RouteData;
    /**
     * Data from the action for the current matches
     */
    actionData: RouteData | null;
    /**
     * Errors caught from loaders for the current matches
     */
    errors: RouteData | null;
    /**
     * Map of current fetchers
     */
    fetchers: Map<string, Fetcher>;
    /**
     * Map of current blockers
     */
    blockers: Map<string, Blocker>;
}
/**
 * Data that can be passed into hydrate a Router from SSR
 */
type HydrationState = Partial<Pick<RouterState, "loaderData" | "actionData" | "errors">>;
/**
 * Future flags to toggle new feature behavior
 */
interface FutureConfig {
    unstable_passThroughRequests: boolean;
}
/**
 * Initialization options for createRouter
 */
interface RouterInit {
    routes: RouteObject[];
    history: History;
    basename?: string;
    getContext?: () => MaybePromise<RouterContextProvider>;
    unstable_instrumentations?: unstable_ClientInstrumentation[];
    mapRouteProperties?: MapRoutePropertiesFunction;
    future?: Partial<FutureConfig>;
    hydrationRouteProperties?: string[];
    hydrationData?: HydrationState;
    window?: Window;
    dataStrategy?: DataStrategyFunction;
    patchRoutesOnNavigation?: PatchRoutesOnNavigationFunction;
}
/**
 * State returned from a server-side query() call
 */
interface StaticHandlerContext {
    basename: Router["basename"];
    location: RouterState["location"];
    matches: RouterState["matches"];
    loaderData: RouterState["loaderData"];
    actionData: RouterState["actionData"];
    errors: RouterState["errors"];
    statusCode: number;
    loaderHeaders: Record<string, Headers>;
    actionHeaders: Record<string, Headers>;
    _deepestRenderedBoundaryId?: string | null;
}
/**
 * A StaticHandler instance manages a singular SSR navigation/fetch event
 */
interface StaticHandler {
    dataRoutes: DataRouteObject[];
    query(request: Request, opts?: {
        requestContext?: unknown;
        filterMatchesToLoad?: (match: DataRouteMatch) => boolean;
        skipLoaderErrorBubbling?: boolean;
        skipRevalidation?: boolean;
        dataStrategy?: DataStrategyFunction<unknown>;
        generateMiddlewareResponse?: (query: (r: Request, args?: {
            filterMatchesToLoad?: (match: DataRouteMatch) => boolean;
        }) => Promise<StaticHandlerContext | Response>) => MaybePromise<Response>;
        unstable_normalizePath?: (request: Request) => Path;
    }): Promise<StaticHandlerContext | Response>;
    queryRoute(request: Request, opts?: {
        routeId?: string;
        requestContext?: unknown;
        dataStrategy?: DataStrategyFunction<unknown>;
        generateMiddlewareResponse?: (queryRoute: (r: Request) => Promise<Response>) => MaybePromise<Response>;
        unstable_normalizePath?: (request: Request) => Path;
    }): Promise<any>;
}
type ViewTransitionOpts = {
    currentLocation: Location;
    nextLocation: Location;
};
/**
 * Subscriber function signature for changes to router state
 */
interface RouterSubscriber {
    (state: RouterState, opts: {
        deletedFetchers: string[];
        newErrors: RouteData | null;
        viewTransitionOpts?: ViewTransitionOpts;
        flushSync: boolean;
    }): void;
}
/**
 * Function signature for determining the key to be used in scroll restoration
 * for a given location
 */
interface GetScrollRestorationKeyFunction {
    (location: Location, matches: UIMatch[]): string | null;
}
/**
 * Function signature for determining the current scroll position
 */
interface GetScrollPositionFunction {
    (): number;
}
/**
 * - "route": relative to the route hierarchy so `..` means remove all segments
 * of the current route even if it has many. For example, a `route("posts/:id")`
 * would have both `:id` and `posts` removed from the url.
 * - "path": relative to the pathname so `..` means remove one segment of the
 * pathname. For example, a `route("posts/:id")` would have only `:id` removed
 * from the url.
 */
type RelativeRoutingType = "route" | "path";
type BaseNavigateOrFetchOptions = {
    preventScrollReset?: boolean;
    relative?: RelativeRoutingType;
    flushSync?: boolean;
    unstable_defaultShouldRevalidate?: boolean;
};
type BaseNavigateOptions = BaseNavigateOrFetchOptions & {
    replace?: boolean;
    state?: any;
    fromRouteId?: string;
    viewTransition?: boolean;
    unstable_mask?: To;
};
type BaseSubmissionOptions = {
    formMethod?: HTMLFormMethod;
    formEncType?: FormEncType;
} & ({
    formData: FormData;
    body?: undefined;
} | {
    formData?: undefined;
    body: any;
});
/**
 * Options for a navigate() call for a normal (non-submission) navigation
 */
type LinkNavigateOptions = BaseNavigateOptions;
/**
 * Options for a navigate() call for a submission navigation
 */
type SubmissionNavigateOptions = BaseNavigateOptions & BaseSubmissionOptions;
/**
 * Options to pass to navigate() for a navigation
 */
type RouterNavigateOptions = LinkNavigateOptions | SubmissionNavigateOptions;
/**
 * Options for a fetch() load
 */
type LoadFetchOptions = BaseNavigateOrFetchOptions;
/**
 * Options for a fetch() submission
 */
type SubmitFetchOptions = BaseNavigateOrFetchOptions & BaseSubmissionOptions;
/**
 * Options to pass to fetch()
 */
type RouterFetchOptions = LoadFetchOptions | SubmitFetchOptions;
/**
 * Potential states for state.navigation
 */
type NavigationStates = {
    Idle: {
        state: "idle";
        location: undefined;
        formMethod: undefined;
        formAction: undefined;
        formEncType: undefined;
        formData: undefined;
        json: undefined;
        text: undefined;
    };
    Loading: {
        state: "loading";
        location: Location;
        formMethod: Submission["formMethod"] | undefined;
        formAction: Submission["formAction"] | undefined;
        formEncType: Submission["formEncType"] | undefined;
        formData: Submission["formData"] | undefined;
        json: Submission["json"] | undefined;
        text: Submission["text"] | undefined;
    };
    Submitting: {
        state: "submitting";
        location: Location;
        formMethod: Submission["formMethod"];
        formAction: Submission["formAction"];
        formEncType: Submission["formEncType"];
        formData: Submission["formData"];
        json: Submission["json"];
        text: Submission["text"];
    };
};
type Navigation = NavigationStates[keyof NavigationStates];
type RevalidationState = "idle" | "loading";
/**
 * Potential states for fetchers
 */
type FetcherStates<TData = any> = {
    /**
     * The fetcher is not calling a loader or action
     *
     * ```tsx
     * fetcher.state === "idle"
     * ```
     */
    Idle: {
        state: "idle";
        formMethod: undefined;
        formAction: undefined;
        formEncType: undefined;
        text: undefined;
        formData: undefined;
        json: undefined;
        /**
         * If the fetcher has never been called, this will be undefined.
         */
        data: TData | undefined;
    };
    /**
     * The fetcher is loading data from a {@link LoaderFunction | loader} from a
     * call to {@link FetcherWithComponents.load | `fetcher.load`}.
     *
     * ```tsx
     * // somewhere
     * <button onClick={() => fetcher.load("/some/route") }>Load</button>
     *
     * // the state will update
     * fetcher.state === "loading"
     * ```
     */
    Loading: {
        state: "loading";
        formMethod: Submission["formMethod"] | undefined;
        formAction: Submission["formAction"] | undefined;
        formEncType: Submission["formEncType"] | undefined;
        text: Submission["text"] | undefined;
        formData: Submission["formData"] | undefined;
        json: Submission["json"] | undefined;
        data: TData | undefined;
    };
    /**
      The fetcher is submitting to a {@link LoaderFunction} (GET) or {@link ActionFunction} (POST) from a {@link FetcherWithComponents.Form | `fetcher.Form`} or {@link FetcherWithComponents.submit | `fetcher.submit`}.
  
      ```tsx
      // somewhere
      <input
        onChange={e => {
          fetcher.submit(event.currentTarget.form, { method: "post" });
        }}
      />
  
      // the state will update
      fetcher.state === "submitting"
  
      // and formData will be available
      fetcher.formData
      ```
     */
    Submitting: {
        state: "submitting";
        formMethod: Submission["formMethod"];
        formAction: Submission["formAction"];
        formEncType: Submission["formEncType"];
        text: Submission["text"];
        formData: Submission["formData"];
        json: Submission["json"];
        data: TData | undefined;
    };
};
type Fetcher<TData = any> = FetcherStates<TData>[keyof FetcherStates<TData>];
interface BlockerBlocked {
    state: "blocked";
    reset: () => void;
    proceed: () => void;
    location: Location;
}
interface BlockerUnblocked {
    state: "unblocked";
    reset: undefined;
    proceed: undefined;
    location: undefined;
}
interface BlockerProceeding {
    state: "proceeding";
    reset: undefined;
    proceed: undefined;
    location: Location;
}
type Blocker = BlockerUnblocked | BlockerBlocked | BlockerProceeding;
type BlockerFunction = (args: {
    currentLocation: Location;
    nextLocation: Location;
    historyAction: Action;
}) => boolean;
interface CreateStaticHandlerOptions {
    basename?: string;
    mapRouteProperties?: MapRoutePropertiesFunction;
    unstable_instrumentations?: Pick<unstable_ServerInstrumentation, "route">[];
    future?: Partial<FutureConfig>;
}
declare function createStaticHandler(routes: RouteObject[], opts?: CreateStaticHandlerOptions): StaticHandler;

type Primitive = null | undefined | string | number | boolean | symbol | bigint;
type LiteralUnion<LiteralType, BaseType extends Primitive> = LiteralType | (BaseType & Record<never, never>);
interface HtmlLinkProps {
    /**
     * Address of the hyperlink
     */
    href?: string;
    /**
     * How the element handles crossorigin requests
     */
    crossOrigin?: "anonymous" | "use-credentials";
    /**
     * Relationship between the document containing the hyperlink and the destination resource
     */
    rel: LiteralUnion<"alternate" | "dns-prefetch" | "icon" | "manifest" | "modulepreload" | "next" | "pingback" | "preconnect" | "prefetch" | "preload" | "prerender" | "search" | "stylesheet", string>;
    /**
     * Applicable media: "screen", "print", "(max-width: 764px)"
     */
    media?: string;
    /**
     * Integrity metadata used in Subresource Integrity checks
     */
    integrity?: string;
    /**
     * Language of the linked resource
     */
    hrefLang?: string;
    /**
     * Hint for the type of the referenced resource
     */
    type?: string;
    /**
     * Referrer policy for fetches initiated by the element
     */
    referrerPolicy?: "" | "no-referrer" | "no-referrer-when-downgrade" | "same-origin" | "origin" | "strict-origin" | "origin-when-cross-origin" | "strict-origin-when-cross-origin" | "unsafe-url";
    /**
     * Sizes of the icons (for rel="icon")
     */
    sizes?: string;
    /**
     * Potential destination for a preload request (for rel="preload" and rel="modulepreload")
     */
    as?: LiteralUnion<"audio" | "audioworklet" | "document" | "embed" | "fetch" | "font" | "frame" | "iframe" | "image" | "manifest" | "object" | "paintworklet" | "report" | "script" | "serviceworker" | "sharedworker" | "style" | "track" | "video" | "worker" | "xslt", string>;
    /**
     * Color to use when customizing a site's icon (for rel="mask-icon")
     */
    color?: string;
    /**
     * Whether the link is disabled
     */
    disabled?: boolean;
    /**
     * The title attribute has special semantics on this element: Title of the link; CSS style sheet set name.
     */
    title?: string;
    /**
     * Images to use in different situations, e.g., high-resolution displays,
     * small monitors, etc. (for rel="preload")
     */
    imageSrcSet?: string;
    /**
     * Image sizes for different page layouts (for rel="preload")
     */
    imageSizes?: string;
}
interface HtmlLinkPreloadImage extends HtmlLinkProps {
    /**
     * Relationship between the document containing the hyperlink and the destination resource
     */
    rel: "preload";
    /**
     * Potential destination for a preload request (for rel="preload" and rel="modulepreload")
     */
    as: "image";
    /**
     * Address of the hyperlink
     */
    href?: string;
    /**
     * Images to use in different situations, e.g., high-resolution displays,
     * small monitors, etc. (for rel="preload")
     */
    imageSrcSet: string;
    /**
     * Image sizes for different page layouts (for rel="preload")
     */
    imageSizes?: string;
}
/**
 * Represents a `<link>` element.
 *
 * WHATWG Specification: https://html.spec.whatwg.org/multipage/semantics.html#the-link-element
 */
type HtmlLinkDescriptor = (HtmlLinkProps & Pick<Required<HtmlLinkProps>, "href">) | (HtmlLinkPreloadImage & Pick<Required<HtmlLinkPreloadImage>, "imageSizes">) | (HtmlLinkPreloadImage & Pick<Required<HtmlLinkPreloadImage>, "href"> & {
    imageSizes?: never;
});
interface PageLinkDescriptor extends Omit<HtmlLinkDescriptor, "href" | "rel" | "type" | "sizes" | "imageSrcSet" | "imageSizes" | "as" | "color" | "title"> {
    /**
     * A [`nonce`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce)
     * attribute to render on the [`<link>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link)
     * element
     */
    nonce?: string | undefined;
    /**
     * The absolute path of the page to prefetch, e.g. `/absolute/path`.
     */
    page: string;
}
type LinkDescriptor = HtmlLinkDescriptor | PageLinkDescriptor;

type Serializable = undefined | null | boolean | string | symbol | number | Array<Serializable> | {
    [key: PropertyKey]: Serializable;
} | bigint | Date | URL | RegExp | Error | Map<Serializable, Serializable> | Set<Serializable> | Promise<Serializable>;

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type IsAny<T> = 0 extends 1 & T ? true : false;
type Func = (...args: any[]) => unknown;

/**
 * A brand that can be applied to a type to indicate that it will serialize
 * to a specific type when transported to the client from a loader.
 * Only use this if you have additional serialization/deserialization logic
 * in your application.
 */
type unstable_SerializesTo<T> = {
    unstable__ReactRouter_SerializesTo: [T];
};

type Serialize<T> = T extends unstable_SerializesTo<infer To> ? To : T extends Serializable ? T : T extends (...args: any[]) => unknown ? undefined : T extends Promise<infer U> ? Promise<Serialize<U>> : T extends Map<infer K, infer V> ? Map<Serialize<K>, Serialize<V>> : T extends ReadonlyMap<infer K, infer V> ? ReadonlyMap<Serialize<K>, Serialize<V>> : T extends Set<infer U> ? Set<Serialize<U>> : T extends ReadonlySet<infer U> ? ReadonlySet<Serialize<U>> : T extends [] ? [] : T extends readonly [infer F, ...infer R] ? [Serialize<F>, ...Serialize<R>] : T extends Array<infer U> ? Array<Serialize<U>> : T extends readonly unknown[] ? readonly Serialize<T[number]>[] : T extends Record<any, any> ? {
    [K in keyof T]: Serialize<T[K]>;
} : undefined;
type VoidToUndefined<T> = Equal<T, void> extends true ? undefined : T;
type DataFrom<T> = IsAny<T> extends true ? undefined : T extends Func ? VoidToUndefined<Awaited<ReturnType<T>>> : undefined;
type ClientData<T> = T extends Response ? never : T extends DataWithResponseInit<infer U> ? U : T;
type ServerData<T> = T extends Response ? never : T extends DataWithResponseInit<infer U> ? Serialize<U> : Serialize<T>;
type ServerDataFrom<T> = ServerData<DataFrom<T>>;
type ClientDataFrom<T> = ClientData<DataFrom<T>>;
type ClientDataFunctionArgs<Params> = {
    /**
     * A {@link https://developer.mozilla.org/en-US/docs/Web/API/Request Fetch Request instance} which you can use to read the URL, the method, the "content-type" header, and the request body from the request.
     *
     * @note Because client data functions are called before a network request is made, the Request object does not include the headers which the browser automatically adds. React Router infers the "content-type" header from the enc-type of the form that performed the submission.
     **/
    request: Request;
    /**
     * A URL instance representing the application location being navigated to or fetched.
     * Without `future.unstable_passThroughRequests` enabled, this matches `request.url`.
     * With `future.unstable_passThroughRequests` enabled, this is a normalized
     * URL with React-Router-specific implementation details removed (`.data`
     * pathnames, `index`/`_routes` search params).
     * The URL includes the origin from the request for convenience.
     */
    unstable_url: URL;
    /**
     * {@link https://reactrouter.com/start/framework/routing#dynamic-segments Dynamic route params} for the current route.
     * @example
     * // app/routes.ts
     * route("teams/:teamId", "./team.tsx"),
     *
     * // app/team.tsx
     * export function clientLoader({
     *   params,
     * }: Route.ClientLoaderArgs) {
     *   params.teamId;
     *   //        ^ string
     * }
     **/
    params: Params;
    /**
     * Matched un-interpolated route pattern for the current path (i.e., /blog/:slug).
     * Mostly useful as a identifier to aggregate on for logging/tracing/etc.
     */
    unstable_pattern: string;
    /**
     * When `future.v8_middleware` is not enabled, this is undefined.
     *
     * When `future.v8_middleware` is enabled, this is an instance of
     * `RouterContextProvider` and can be used to access context values
     * from your route middlewares.  You may pass in initial context values in your
     * `<HydratedRouter getContext>` prop
     */
    context: Readonly<RouterContextProvider>;
};
type SerializeFrom<T> = T extends (...args: infer Args) => unknown ? Args extends [
    ClientLoaderFunctionArgs | ClientActionFunctionArgs | ClientDataFunctionArgs<unknown>
] ? ClientDataFrom<T> : ServerDataFrom<T> : T;

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
    /** @deprecated Use `MetaMatch.loaderData` instead */
    data: Loader extends LoaderFunction | ClientLoaderFunction ? SerializeFrom<Loader> : unknown;
    loaderData: Loader extends LoaderFunction | ClientLoaderFunction ? SerializeFrom<Loader> : unknown;
    handle?: RouteHandle;
    params: DataRouteMatch["params"];
    meta: MetaDescriptor[];
    error?: unknown;
}
type MetaMatches<MatchLoaders extends Record<string, LoaderFunction | ClientLoaderFunction | unknown> = Record<string, unknown>> = Array<{
    [K in keyof MatchLoaders]: MetaMatch<Exclude<K, number | symbol>, MatchLoaders[K]>;
}[keyof MatchLoaders]>;
interface MetaArgs<Loader extends LoaderFunction | ClientLoaderFunction | unknown = unknown, MatchLoaders extends Record<string, LoaderFunction | ClientLoaderFunction | unknown> = Record<string, unknown>> {
    /** @deprecated Use `MetaArgs.loaderData` instead */
    data: (Loader extends LoaderFunction | ClientLoaderFunction ? SerializeFrom<Loader> : unknown) | undefined;
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
    "script:ld+json": LdJsonObject;
} | {
    tagName: "meta" | "link";
    [name: string]: string;
} | {
    [name: string]: unknown;
};
type LdJsonObject = {
    [Key in string]: LdJsonValue;
} & {
    [Key in string]?: LdJsonValue | undefined;
};
type LdJsonArray = LdJsonValue[] | readonly LdJsonValue[];
type LdJsonPrimitive = string | number | boolean | null;
type LdJsonValue = LdJsonPrimitive | LdJsonObject | LdJsonArray;
/**
 * An arbitrary object that is associated with a route.
 *
 * @see https://reactrouter.com/how-to/using-handle
 */
type RouteHandle = unknown;

interface AwaitResolveRenderFunction<Resolve = any> {
    (data: Awaited<Resolve>): React.ReactNode;
}
/**
 * @category Types
 */
interface AwaitProps<Resolve> {
    /**
     * When using a function, the resolved value is provided as the parameter.
     *
     * ```tsx [2]
     * <Await resolve={reviewsPromise}>
     *   {(resolvedReviews) => <Reviews items={resolvedReviews} />}
     * </Await>
     * ```
     *
     * When using React elements, {@link useAsyncValue} will provide the
     * resolved value:
     *
     * ```tsx [2]
     * <Await resolve={reviewsPromise}>
     *   <Reviews />
     * </Await>
     *
     * function Reviews() {
     *   const resolvedReviews = useAsyncValue();
     *   return <div>...</div>;
     * }
     * ```
     */
    children: React.ReactNode | AwaitResolveRenderFunction<Resolve>;
    /**
     * The error element renders instead of the `children` when the [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
     * rejects.
     *
     * ```tsx
     * <Await
     *   errorElement={<div>Oops</div>}
     *   resolve={reviewsPromise}
     * >
     *   <Reviews />
     * </Await>
     * ```
     *
     * To provide a more contextual error, you can use the {@link useAsyncError} in a
     * child component
     *
     * ```tsx
     * <Await
     *   errorElement={<ReviewsError />}
     *   resolve={reviewsPromise}
     * >
     *   <Reviews />
     * </Await>
     *
     * function ReviewsError() {
     *   const error = useAsyncError();
     *   return <div>Error loading reviews: {error.message}</div>;
     * }
     * ```
     *
     * If you do not provide an `errorElement`, the rejected value will bubble up
     * to the nearest route-level [`ErrorBoundary`](../../start/framework/route-module#errorboundary)
     * and be accessible via the {@link useRouteError} hook.
     */
    errorElement?: React.ReactNode;
    /**
     * Takes a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
     * returned from a [`loader`](../../start/framework/route-module#loader) to be
     * resolved and rendered.
     *
     * ```tsx
     * import { Await, useLoaderData } from "react-router";
     *
     * export async function loader() {
     *   let reviews = getReviews(); // not awaited
     *   let book = await getBook();
     *   return {
     *     book,
     *     reviews, // this is a promise
     *   };
     * }
     *
     * export default function Book() {
     *   const {
     *     book,
     *     reviews, // this is the same promise
     *   } = useLoaderData();
     *
     *   return (
     *     <div>
     *       <h1>{book.title}</h1>
     *       <p>{book.description}</p>
     *       <React.Suspense fallback={<ReviewsSkeleton />}>
     *         <Await
     *           // and is the promise we pass to Await
     *           resolve={reviews}
     *         >
     *           <Reviews />
     *         </Await>
     *       </React.Suspense>
     *     </div>
     *   );
     * }
     * ```
     */
    resolve: Resolve;
}
/**
 * Used to render promise values with automatic error handling.
 *
 * **Note:** `<Await>` expects to be rendered inside a [`<React.Suspense>`](https://react.dev/reference/react/Suspense)
 *
 * @example
 * import { Await, useLoaderData } from "react-router";
 *
 * export async function loader() {
 *   // not awaited
 *   const reviews = getReviews();
 *   // awaited (blocks the transition)
 *   const book = await fetch("/api/book").then((res) => res.json());
 *   return { book, reviews };
 * }
 *
 * function Book() {
 *   const { book, reviews } = useLoaderData();
 *   return (
 *     <div>
 *       <h1>{book.title}</h1>
 *       <p>{book.description}</p>
 *       <React.Suspense fallback={<ReviewsSkeleton />}>
 *         <Await
 *           resolve={reviews}
 *           errorElement={
 *             <div>Could not load reviews 😬</div>
 *           }
 *           children={(resolvedReviews) => (
 *             <Reviews items={resolvedReviews} />
 *           )}
 *         />
 *       </React.Suspense>
 *     </div>
 *   );
 * }
 *
 * @public
 * @category Components
 * @mode framework
 * @mode data
 * @param props Props
 * @param {AwaitProps.children} props.children n/a
 * @param {AwaitProps.errorElement} props.errorElement n/a
 * @param {AwaitProps.resolve} props.resolve n/a
 * @returns React element for the rendered awaited value
 */
declare function Await$1<Resolve>({ children, errorElement, resolve, }: AwaitProps<Resolve>): React.JSX.Element;

declare function getRequest(): Request;
declare const redirect: typeof redirect$1;
declare const redirectDocument: typeof redirectDocument$1;
declare const replace: typeof replace$1;
declare const Await: typeof Await$1;
type RSCRouteConfigEntryBase = {
    action?: ActionFunction;
    clientAction?: ClientActionFunction;
    clientLoader?: ClientLoaderFunction;
    ErrorBoundary?: React.ComponentType<any>;
    handle?: any;
    headers?: HeadersFunction;
    HydrateFallback?: React.ComponentType<any>;
    Layout?: React.ComponentType<any>;
    links?: LinksFunction;
    loader?: LoaderFunction;
    meta?: MetaFunction;
    shouldRevalidate?: ShouldRevalidateFunction;
};
type RSCRouteConfigEntry = RSCRouteConfigEntryBase & {
    id: string;
    path?: string;
    Component?: React.ComponentType<any>;
    lazy?: () => Promise<RSCRouteConfigEntryBase & ({
        default?: React.ComponentType<any>;
        Component?: never;
    } | {
        default?: never;
        Component?: React.ComponentType<any>;
    })>;
} & ({
    index: true;
} | {
    children?: RSCRouteConfigEntry[];
});
type RSCRouteConfig = Array<RSCRouteConfigEntry>;
type RSCRouteManifest = {
    clientAction?: ClientActionFunction;
    clientLoader?: ClientLoaderFunction;
    element?: React.ReactElement | false;
    errorElement?: React.ReactElement;
    handle?: any;
    hasAction: boolean;
    hasComponent: boolean;
    hasErrorBoundary: boolean;
    hasLoader: boolean;
    hydrateFallbackElement?: React.ReactElement;
    id: string;
    index?: boolean;
    links?: LinksFunction;
    meta?: MetaFunction;
    parentId?: string;
    path?: string;
    shouldRevalidate?: ShouldRevalidateFunction;
};
type RSCRouteMatch = RSCRouteManifest & {
    params: Params;
    pathname: string;
    pathnameBase: string;
};
type RSCRenderPayload = {
    type: "render";
    actionData: Record<string, any> | null;
    basename: string | undefined;
    errors: Record<string, any> | null;
    loaderData: Record<string, any>;
    location: Location;
    routeDiscovery: RouteDiscovery;
    matches: RSCRouteMatch[];
    patches?: Promise<RSCRouteManifest[]>;
    nonce?: string;
    formState?: unknown;
};
type RSCManifestPayload = {
    type: "manifest";
    patches: Promise<RSCRouteManifest[]>;
};
type RSCActionPayload = {
    type: "action";
    actionResult: Promise<unknown>;
    rerender?: Promise<RSCRenderPayload | RSCRedirectPayload>;
};
type RSCRedirectPayload = {
    type: "redirect";
    status: number;
    location: string;
    replace: boolean;
    reload: boolean;
    actionResult?: Promise<unknown>;
};
type RSCPayload = RSCRenderPayload | RSCManifestPayload | RSCActionPayload | RSCRedirectPayload;
type RSCMatch = {
    statusCode: number;
    headers: Headers;
    payload: RSCPayload;
};
type DecodeActionFunction = (formData: FormData) => Promise<() => Promise<unknown>>;
type DecodeFormStateFunction = (result: unknown, formData: FormData) => unknown;
type DecodeReplyFunction = (reply: FormData | string, options: {
    temporaryReferences: unknown;
}) => Promise<unknown[]>;
type LoadServerActionFunction = (id: string) => Promise<Function>;
type RouteDiscovery = {
    mode: "lazy";
    manifestPath?: string | undefined;
} | {
    mode: "initial";
};
/**
 * Matches the given routes to a [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)
 * and returns an [RSC](https://react.dev/reference/rsc/server-components)
 * [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * encoding an {@link unstable_RSCPayload} for consumption by an [RSC](https://react.dev/reference/rsc/server-components)
 * enabled client router.
 *
 * @example
 * import {
 *   createTemporaryReferenceSet,
 *   decodeAction,
 *   decodeReply,
 *   loadServerAction,
 *   renderToReadableStream,
 * } from "@vitejs/plugin-rsc/rsc";
 * import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";
 *
 * matchRSCServerRequest({
 *   createTemporaryReferenceSet,
 *   decodeAction,
 *   decodeFormState,
 *   decodeReply,
 *   loadServerAction,
 *   request,
 *   routes: routes(),
 *   generateResponse(match) {
 *     return new Response(
 *       renderToReadableStream(match.payload),
 *       {
 *         status: match.statusCode,
 *         headers: match.headers,
 *       }
 *     );
 *   },
 * });
 *
 * @name unstable_matchRSCServerRequest
 * @public
 * @category RSC
 * @mode data
 * @param opts Options
 * @param opts.allowedActionOrigins Origin patterns that are allowed to execute actions.
 * @param opts.basename The basename to use when matching the request.
 * @param opts.createTemporaryReferenceSet A function that returns a temporary
 * reference set for the request, used to track temporary references in the [RSC](https://react.dev/reference/rsc/server-components)
 * stream.
 * @param opts.decodeAction Your `react-server-dom-xyz/server`'s `decodeAction`
 * function, responsible for loading a server action.
 * @param opts.decodeFormState A function responsible for decoding form state for
 * progressively enhanceable forms with React's [`useActionState`](https://react.dev/reference/react/useActionState)
 * using your `react-server-dom-xyz/server`'s `decodeFormState`.
 * @param opts.decodeReply Your `react-server-dom-xyz/server`'s `decodeReply`
 * function, used to decode the server function's arguments and bind them to the
 * implementation for invocation by the router.
 * @param opts.generateResponse A function responsible for using your
 * `renderToReadableStream` to generate a [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * encoding the {@link unstable_RSCPayload}.
 * @param opts.loadServerAction Your `react-server-dom-xyz/server`'s
 * `loadServerAction` function, used to load a server action by ID.
 * @param opts.onError An optional error handler that will be called with any
 * errors that occur during the request processing.
 * @param opts.request The [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)
 * to match against.
 * @param opts.requestContext An instance of {@link RouterContextProvider}
 * that should be created per request, to be passed to [`action`](../../start/data/route-object#action)s,
 * [`loader`](../../start/data/route-object#loader)s and [middleware](../../how-to/middleware).
 * @param opts.routeDiscovery The route discovery configuration, used to determine how the router should discover new routes during navigations.
 * @param opts.routes Your {@link unstable_RSCRouteConfigEntry | route definitions}.
 * @returns A [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * that contains the [RSC](https://react.dev/reference/rsc/server-components)
 * data for hydration.
 */
declare function matchRSCServerRequest({ allowedActionOrigins, createTemporaryReferenceSet, basename, decodeReply, requestContext, routeDiscovery, loadServerAction, decodeAction, decodeFormState, onError, request, routes, generateResponse, }: {
    allowedActionOrigins?: string[];
    createTemporaryReferenceSet: () => unknown;
    basename?: string;
    decodeReply?: DecodeReplyFunction;
    decodeAction?: DecodeActionFunction;
    decodeFormState?: DecodeFormStateFunction;
    requestContext?: RouterContextProvider;
    loadServerAction?: LoadServerActionFunction;
    onError?: (error: unknown) => void;
    request: Request;
    routes: RSCRouteConfigEntry[];
    routeDiscovery?: RouteDiscovery;
    generateResponse: (match: RSCMatch, { onError, temporaryReferences, }: {
        onError(error: unknown): string | undefined;
        temporaryReferences: unknown;
    }) => Response;
}): Promise<Response>;

/**
 * Apps can use this interface to "register" app-wide types for React Router via interface declaration merging and module augmentation.
 * React Router should handle this for you via type generation.
 *
 * For more on declaration merging and module augmentation, see https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation .
 */
interface Register {
}
type AnyParams = Record<string, string | undefined>;
type AnyPages = Record<string, {
    params: AnyParams;
}>;
type Pages = Register extends {
    pages: infer Registered extends AnyPages;
} ? Registered : AnyPages;

type Args = {
    [K in keyof Pages]: ToArgs<Pages[K]["params"]>;
};
type ToArgs<Params extends Record<string, string | undefined>> = Equal<Params, {}> extends true ? [] : Partial<Params> extends Params ? [Params] | [] : [
    Params
];
/**
  Returns a resolved URL path for the specified route.

  ```tsx
  const h = href("/:lang?/about", { lang: "en" })
  // -> `/en/about`

  <Link to={href("/products/:id", { id: "abc123" })} />
  ```
 */
declare function href<Path extends keyof Args>(path: Path, ...args: Args[Path]): string;

interface CookieSignatureOptions {
    /**
     * An array of secrets that may be used to sign/unsign the value of a cookie.
     *
     * The array makes it easy to rotate secrets. New secrets should be added to
     * the beginning of the array. `cookie.serialize()` will always use the first
     * value in the array, but `cookie.parse()` may use any of them so that
     * cookies that were signed with older secrets still work.
     */
    secrets?: string[];
}
type CookieOptions = ParseOptions & SerializeOptions & CookieSignatureOptions;
/**
 * A HTTP cookie.
 *
 * A Cookie is a logical container for metadata about a HTTP cookie; its name
 * and options. But it doesn't contain a value. Instead, it has `parse()` and
 * `serialize()` methods that allow a single instance to be reused for
 * parsing/encoding multiple different values.
 *
 * @see https://remix.run/utils/cookies#cookie-api
 */
interface Cookie {
    /**
     * The name of the cookie, used in the `Cookie` and `Set-Cookie` headers.
     */
    readonly name: string;
    /**
     * True if this cookie uses one or more secrets for verification.
     */
    readonly isSigned: boolean;
    /**
     * The Date this cookie expires.
     *
     * Note: This is calculated at access time using `maxAge` when no `expires`
     * option is provided to `createCookie()`.
     */
    readonly expires?: Date;
    /**
     * Parses a raw `Cookie` header and returns the value of this cookie or
     * `null` if it's not present.
     */
    parse(cookieHeader: string | null, options?: ParseOptions): Promise<any>;
    /**
     * Serializes the given value to a string and returns the `Set-Cookie`
     * header.
     */
    serialize(value: any, options?: SerializeOptions): Promise<string>;
}
/**
 * Creates a logical container for managing a browser cookie from the server.
 */
declare const createCookie: (name: string, cookieOptions?: CookieOptions) => Cookie;
type IsCookieFunction = (object: any) => object is Cookie;
/**
 * Returns true if an object is a Remix cookie container.
 *
 * @see https://remix.run/utils/cookies#iscookie
 */
declare const isCookie: IsCookieFunction;

/**
 * An object of name/value pairs to be used in the session.
 */
interface SessionData {
    [name: string]: any;
}
/**
 * Session persists data across HTTP requests.
 *
 * @see https://reactrouter.com/explanation/sessions-and-cookies#sessions
 */
interface Session<Data = SessionData, FlashData = Data> {
    /**
     * A unique identifier for this session.
     *
     * Note: This will be the empty string for newly created sessions and
     * sessions that are not backed by a database (i.e. cookie-based sessions).
     */
    readonly id: string;
    /**
     * The raw data contained in this session.
     *
     * This is useful mostly for SessionStorage internally to access the raw
     * session data to persist.
     */
    readonly data: FlashSessionData<Data, FlashData>;
    /**
     * Returns `true` if the session has a value for the given `name`, `false`
     * otherwise.
     */
    has(name: (keyof Data | keyof FlashData) & string): boolean;
    /**
     * Returns the value for the given `name` in this session.
     */
    get<Key extends (keyof Data | keyof FlashData) & string>(name: Key): (Key extends keyof Data ? Data[Key] : undefined) | (Key extends keyof FlashData ? FlashData[Key] : undefined) | undefined;
    /**
     * Sets a value in the session for the given `name`.
     */
    set<Key extends keyof Data & string>(name: Key, value: Data[Key]): void;
    /**
     * Sets a value in the session that is only valid until the next `get()`.
     * This can be useful for temporary values, like error messages.
     */
    flash<Key extends keyof FlashData & string>(name: Key, value: FlashData[Key]): void;
    /**
     * Removes a value from the session.
     */
    unset(name: keyof Data & string): void;
}
type FlashSessionData<Data, FlashData> = Partial<Data & {
    [Key in keyof FlashData as FlashDataKey<Key & string>]: FlashData[Key];
}>;
type FlashDataKey<Key extends string> = `__flash_${Key}__`;
type CreateSessionFunction = <Data = SessionData, FlashData = Data>(initialData?: Data, id?: string) => Session<Data, FlashData>;
/**
 * Creates a new Session object.
 *
 * Note: This function is typically not invoked directly by application code.
 * Instead, use a `SessionStorage` object's `getSession` method.
 */
declare const createSession: CreateSessionFunction;
type IsSessionFunction = (object: any) => object is Session;
/**
 * Returns true if an object is a React Router session.
 *
 * @see https://reactrouter.com/api/utils/isSession
 */
declare const isSession: IsSessionFunction;
/**
 * SessionStorage stores session data between HTTP requests and knows how to
 * parse and create cookies.
 *
 * A SessionStorage creates Session objects using a `Cookie` header as input.
 * Then, later it generates the `Set-Cookie` header to be used in the response.
 */
interface SessionStorage<Data = SessionData, FlashData = Data> {
    /**
     * Parses a Cookie header from a HTTP request and returns the associated
     * Session. If there is no session associated with the cookie, this will
     * return a new Session with no data.
     */
    getSession: (cookieHeader?: string | null, options?: ParseOptions) => Promise<Session<Data, FlashData>>;
    /**
     * Stores all data in the Session and returns the Set-Cookie header to be
     * used in the HTTP response.
     */
    commitSession: (session: Session<Data, FlashData>, options?: SerializeOptions) => Promise<string>;
    /**
     * Deletes all data associated with the Session and returns the Set-Cookie
     * header to be used in the HTTP response.
     */
    destroySession: (session: Session<Data, FlashData>, options?: SerializeOptions) => Promise<string>;
}
/**
 * SessionIdStorageStrategy is designed to allow anyone to easily build their
 * own SessionStorage using `createSessionStorage(strategy)`.
 *
 * This strategy describes a common scenario where the session id is stored in
 * a cookie but the actual session data is stored elsewhere, usually in a
 * database or on disk. A set of create, read, update, and delete operations
 * are provided for managing the session data.
 */
interface SessionIdStorageStrategy<Data = SessionData, FlashData = Data> {
    /**
     * The Cookie used to store the session id, or options used to automatically
     * create one.
     */
    cookie?: Cookie | (CookieOptions & {
        name?: string;
    });
    /**
     * Creates a new record with the given data and returns the session id.
     */
    createData: (data: FlashSessionData<Data, FlashData>, expires?: Date) => Promise<string>;
    /**
     * Returns data for a given session id, or `null` if there isn't any.
     */
    readData: (id: string) => Promise<FlashSessionData<Data, FlashData> | null>;
    /**
     * Updates data for the given session id.
     */
    updateData: (id: string, data: FlashSessionData<Data, FlashData>, expires?: Date) => Promise<void>;
    /**
     * Deletes data for a given session id from the data store.
     */
    deleteData: (id: string) => Promise<void>;
}
/**
 * Creates a SessionStorage object using a SessionIdStorageStrategy.
 *
 * Note: This is a low-level API that should only be used if none of the
 * existing session storage options meet your requirements.
 */
declare function createSessionStorage<Data = SessionData, FlashData = Data>({ cookie: cookieArg, createData, readData, updateData, deleteData, }: SessionIdStorageStrategy<Data, FlashData>): SessionStorage<Data, FlashData>;

interface CookieSessionStorageOptions {
    /**
     * The Cookie used to store the session data on the client, or options used
     * to automatically create one.
     */
    cookie?: SessionIdStorageStrategy["cookie"];
}
/**
 * Creates and returns a SessionStorage object that stores all session data
 * directly in the session cookie itself.
 *
 * This has the advantage that no database or other backend services are
 * needed, and can help to simplify some load-balanced scenarios. However, it
 * also has the limitation that serialized session data may not exceed the
 * browser's maximum cookie size. Trade-offs!
 */
declare function createCookieSessionStorage<Data = SessionData, FlashData = Data>({ cookie: cookieArg }?: CookieSessionStorageOptions): SessionStorage<Data, FlashData>;

interface MemorySessionStorageOptions {
    /**
     * The Cookie used to store the session id on the client, or options used
     * to automatically create one.
     */
    cookie?: SessionIdStorageStrategy["cookie"];
}
/**
 * Creates and returns a simple in-memory SessionStorage object, mostly useful
 * for testing and as a reference implementation.
 *
 * Note: This storage does not scale beyond a single process, so it is not
 * suitable for most production scenarios.
 */
declare function createMemorySessionStorage<Data = SessionData, FlashData = Data>({ cookie }?: MemorySessionStorageOptions): SessionStorage<Data, FlashData>;

export { Await, type Cookie, type CookieOptions, type CookieSignatureOptions, type FlashSessionData, type IsCookieFunction, type IsSessionFunction, type MiddlewareFunction, type MiddlewareNextFunction, type RouterContext, RouterContextProvider, type Session, type SessionData, type SessionIdStorageStrategy, type SessionStorage, createContext, createCookie, createCookieSessionStorage, createMemorySessionStorage, createSession, createSessionStorage, createStaticHandler, data, href, isCookie, isRouteErrorResponse, isSession, matchRoutes, redirect, redirectDocument, replace, type DecodeActionFunction as unstable_DecodeActionFunction, type DecodeFormStateFunction as unstable_DecodeFormStateFunction, type DecodeReplyFunction as unstable_DecodeReplyFunction, type LoadServerActionFunction as unstable_LoadServerActionFunction, type RSCManifestPayload as unstable_RSCManifestPayload, type RSCMatch as unstable_RSCMatch, type RSCPayload as unstable_RSCPayload, type RSCRenderPayload as unstable_RSCRenderPayload, type RSCRouteConfig as unstable_RSCRouteConfig, type RSCRouteConfigEntry as unstable_RSCRouteConfigEntry, type RSCRouteManifest as unstable_RSCRouteManifest, type RSCRouteMatch as unstable_RSCRouteMatch, getRequest as unstable_getRequest, matchRSCServerRequest as unstable_matchRSCServerRequest };
