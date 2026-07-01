
import { DataWithResponseInit, RouterContextProvider } from "../router/utils.js";
import { Equal, Func, IsAny } from "./utils.js";
import { RouteModule } from "./route-module.js";
import { unstable_SerializesTo } from "./serializes-to.js";
import { Serializable } from "../server-runtime/single-fetch.js";
import { ClientActionFunctionArgs, ClientLoaderFunctionArgs } from "../dom/ssr/routeModules.js";

//#region lib/types/route-data.d.ts
type Serialize<T> = T extends unstable_SerializesTo<infer To> ? To : T extends Serializable ? T : T extends ((...args: any[]) => unknown) ? undefined : T extends Promise<infer U> ? Promise<Serialize<U>> : T extends Map<infer K, infer V> ? Map<Serialize<K>, Serialize<V>> : T extends ReadonlyMap<infer K, infer V> ? ReadonlyMap<Serialize<K>, Serialize<V>> : T extends Set<infer U> ? Set<Serialize<U>> : T extends ReadonlySet<infer U> ? ReadonlySet<Serialize<U>> : T extends [] ? [] : T extends readonly [infer F, ...infer R] ? [Serialize<F>, ...Serialize<R>] : T extends Array<infer U> ? Array<Serialize<U>> : T extends readonly unknown[] ? readonly Serialize<T[number]>[] : T extends Record<any, any> ? { [K in keyof T]: Serialize<T[K]> } : undefined;
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
   * A URL instance representing the application location being navigated to or
   * fetched.
   *
   * In Framework mode, this is a normalized URL with React-Router-specific
   * implementation details removed (`.data` suffixes, `index`/`_routes` search
   * params). For the raw incoming URL, use `request.url`.
   */
  url: URL;
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
  pattern: string;
  /**
   * An instance of `RouterContextProvider` that can be used to access context
   * values from your route middlewares.  You may pass in initial context values
   * in your `<HydratedRouter getContext>` prop.
   */
  context: Readonly<RouterContextProvider>;
};
type ServerDataFunctionArgs<Params> = {
  /** A {@link https://developer.mozilla.org/en-US/docs/Web/API/Request Fetch Request instance} which you can use to read the url, method, headers (such as cookies), and request body from the request. */request: Request;
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
   **/
  params: Params;
  /**
   * Matched un-interpolated route pattern for the current path (i.e., /blog/:slug).
   * Mostly useful as a identifier to aggregate on for logging/tracing/etc.
   */
  pattern: string;
  /**
   * An instance of `RouterContextProvider` that can be used for type-safe
   * access to context values set in your route middlewares.  If you are using
   * a custom server adapter, you may provide an initial set of context values
   * from your `getLoadContext` function.
   */
  context: Readonly<RouterContextProvider>;
};
type SerializeFrom<T> = T extends ((...args: infer Args) => unknown) ? Args extends [ClientLoaderFunctionArgs | ClientActionFunctionArgs | ClientDataFunctionArgs<unknown>] ? ClientDataFrom<T> : ServerDataFrom<T> : T;
type IsDefined<T> = Equal<T, undefined> extends true ? false : true;
type IsHydrate<ClientLoader> = ClientLoader extends {
  hydrate: true;
} ? true : ClientLoader extends {
  hydrate: false;
} ? false : false;
type GetLoaderData<T extends RouteModule> = _DataLoaderData<ServerDataFrom<T["loader"]>, ClientDataFrom<T["clientLoader"]>, IsHydrate<T["clientLoader"]>, T extends {
  HydrateFallback: Func;
} ? true : false>;
type _DataLoaderData<ServerLoaderData, ClientLoaderData, ClientLoaderHydrate extends boolean, HasHydrateFallback> = [HasHydrateFallback, ClientLoaderHydrate] extends [true, true] ? IsDefined<ClientLoaderData> extends true ? ClientLoaderData : undefined : [IsDefined<ClientLoaderData>, IsDefined<ServerLoaderData>] extends [true, true] ? ServerLoaderData | ClientLoaderData : IsDefined<ClientLoaderData> extends true ? ClientLoaderData : IsDefined<ServerLoaderData> extends true ? ServerLoaderData : undefined;
type GetActionData<T extends RouteModule> = _DataActionData<ServerDataFrom<T["action"]>, ClientDataFrom<T["clientAction"]>>;
type _DataActionData<ServerActionData, ClientActionData> = Awaited<[IsDefined<ServerActionData>, IsDefined<ClientActionData>] extends [true, true] ? ServerActionData | ClientActionData : IsDefined<ClientActionData> extends true ? ClientActionData : IsDefined<ServerActionData> extends true ? ServerActionData : undefined>;
//#endregion
export { ClientDataFunctionArgs, GetActionData, GetLoaderData, SerializeFrom, ServerDataFrom, ServerDataFunctionArgs };