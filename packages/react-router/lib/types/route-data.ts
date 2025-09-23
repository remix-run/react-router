import type {
  ClientLoaderFunctionArgs,
  ClientActionFunctionArgs,
} from "../dom/ssr/routeModules";
import type {
  DataWithResponseInit,
  RouterContextProvider,
} from "../router/utils";
import type { Serializable } from "../server-runtime/single-fetch";
import type { AppLoadContext } from "../server-runtime/data";

import type { MiddlewareEnabled } from "./future";
import type { RouteModule } from "./route-module";
import type { unstable_SerializesTo } from "./serializes-to";
import type { Equal, Expect, Func, IsAny, Pretty } from "./utils";

// prettier-ignore
type Serialize<T> =
  // If type has a `SerializesTo` brand, use that type
  T extends unstable_SerializesTo<infer To> ? To :

  // Then, let type stay as-is if its already serializable...
  T extends Serializable ? T :

  // ...then don't allow functions to be serialized...
  T extends (...args: any[]) => unknown ? undefined :

  // ...lastly handle inner types for all container types allowed by `turbo-stream`

  // Promise
  T extends Promise<infer U> ? Promise<Serialize<U>> :

  // Map & Set
  T extends Map<infer K, infer V> ? Map<Serialize<K>, Serialize<V>> :
  T extends ReadonlyMap<infer K, infer V> ? ReadonlyMap<Serialize<K>, Serialize<V>> :
  T extends Set<infer U> ? Set<Serialize<U>> :
  T extends ReadonlySet<infer U> ? ReadonlySet<Serialize<U>> :

  // Array
  T extends [] ? [] :
  T extends readonly [infer F, ...infer R] ? [Serialize<F>, ...Serialize<R>] :
  T extends Array<infer U> ? Array<Serialize<U>> :
  T extends readonly unknown[] ? readonly Serialize<T[number]>[] :

  // Record
  T extends Record<any, any> ? {[K in keyof T]: Serialize<T[K]>} :

  undefined

type VoidToUndefined<T> = Equal<T, void> extends true ? undefined : T;

// prettier-ignore
type DataFrom<T> =
  IsAny<T> extends true ? undefined :
  T extends Func ? VoidToUndefined<Awaited<ReturnType<T>>> :
  undefined

// prettier-ignore
type ClientData<T> =
  T extends Response ? never :
  T extends DataWithResponseInit<infer U> ? U :
  T

// prettier-ignore
type ServerData<T> =
  T extends Response ? never :
  T extends DataWithResponseInit<infer U> ? Serialize<U> :
  Serialize<T>

export type ServerDataFrom<T> = ServerData<DataFrom<T>>;
export type ClientDataFrom<T> = ClientData<DataFrom<T>>;

export type ClientDataFunctionArgs<Params> = {
  /**
   * A {@link https://developer.mozilla.org/en-US/docs/Web/API/Request Fetch Request instance} which you can use to read the URL, the method, the "content-type" header, and the request body from the request.
   *
   * @note Because client data functions are called before a network request is made, the Request object does not include the headers which the browser automatically adds. React Router infers the "content-type" header from the enc-type of the form that performed the submission.
   **/
  request: Request;
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
   * When `future.v8_middleware` is not enabled, this is undefined.
   *
   * When `future.v8_middleware` is enabled, this is an instance of
   * `RouterContextProvider` and can be used to access context values
   * from your route middlewares.  You may pass in initial context values in your
   * `<HydratedRouter getContext>` prop
   */
  context: Readonly<RouterContextProvider>;
};

export type ServerDataFunctionArgs<Params> = {
  /** A {@link https://developer.mozilla.org/en-US/docs/Web/API/Request Fetch Request instance} which you can use to read the url, method, headers (such as cookies), and request body from the request. */
  request: Request;
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
   * Without `future.v8_middleware` enabled, this is the context passed in
   * to your server adapter's `getLoadContext` function. It's a way to bridge the
   * gap between the adapter's request/response API with your React Router app.
   * It is only applicable if you are using a custom server adapter.
   *
   * With `future.v8_middleware` enabled, this is an instance of
   * `RouterContextProvider` and can be used for type-safe access to
   * context value set in your route middlewares.  If you are using a custom
   * server adapter, you may provide an initial set of context values from your
   * `getLoadContext` function.
   */
  context: MiddlewareEnabled extends true
    ? Readonly<RouterContextProvider>
    : AppLoadContext;
};

export type SerializeFrom<T> = T extends (...args: infer Args) => unknown
  ? Args extends [
      | ClientLoaderFunctionArgs
      | ClientActionFunctionArgs
      | ClientDataFunctionArgs<unknown>,
    ]
    ? ClientDataFrom<T>
    : ServerDataFrom<T>
  : T;

type IsDefined<T> = Equal<T, undefined> extends true ? false : true;

// prettier-ignore
type IsHydrate<ClientLoader> =
  ClientLoader extends { hydrate: true } ? true :
  ClientLoader extends { hydrate: false } ? false :
  false

export type GetLoaderData<T extends RouteModule> = _DataLoaderData<
  ServerDataFrom<T["loader"]>,
  ClientDataFrom<T["clientLoader"]>,
  IsHydrate<T["clientLoader"]>,
  T extends { HydrateFallback: Func } ? true : false
>;

// prettier-ignore
type _DataLoaderData<
  ServerLoaderData,
  ClientLoaderData,
  ClientLoaderHydrate extends boolean,
  HasHydrateFallback
> =
  [HasHydrateFallback, ClientLoaderHydrate] extends [true, true] ?
    IsDefined<ClientLoaderData> extends true ? ClientLoaderData :
    undefined
  :
  [IsDefined<ClientLoaderData>, IsDefined<ServerLoaderData>] extends [true, true] ? ServerLoaderData | ClientLoaderData :
  IsDefined<ClientLoaderData> extends true ? ClientLoaderData :
  IsDefined<ServerLoaderData> extends true ? ServerLoaderData :
  undefined

export type GetActionData<T extends RouteModule> = _DataActionData<
  ServerDataFrom<T["action"]>,
  ClientDataFrom<T["clientAction"]>
>;

// prettier-ignore
type _DataActionData<ServerActionData, ClientActionData> = Awaited<
  [IsDefined<ServerActionData>, IsDefined<ClientActionData>] extends [true, true] ? ServerActionData | ClientActionData :
  IsDefined<ClientActionData> extends true ? ClientActionData :
  IsDefined<ServerActionData> extends true ? ServerActionData :
  undefined
>

type __tests = [
  // ServerDataFrom
  Expect<Equal<ServerDataFrom<any>, undefined>>,
  Expect<
    Equal<
      ServerDataFrom<
        () => {
          a: string;
          b: Date;
          c: () => boolean;
          d: unstable_SerializesTo<number>;
        }
      >,
      { a: string; b: Date; c: undefined; d: number }
    >
  >,
  Expect<
    Equal<
      Pretty<
        ServerDataFrom<
          () =>
            | {
                json: string;
                b: Date;
                c: () => boolean;
                d: unstable_SerializesTo<number>;
              }
            | DataWithResponseInit<{
                data: string;
                b: Date;
                c: () => boolean;
                d: unstable_SerializesTo<number>;
              }>
        >
      >,
      | { json: string; b: Date; c: undefined; d: number }
      | { data: string; b: Date; c: undefined; d: number }
    >
  >,
  Expect<Equal<ServerDataFrom<() => { a: string } | Response>, { a: string }>>,
  Expect<
    Equal<
      ServerDataFrom<
        () => {
          map: Map<string, number>;
          readonlyMap: ReadonlyMap<string, number>;
        }
      >,
      { map: Map<string, number>; readonlyMap: ReadonlyMap<string, number> }
    >
  >,
  Expect<
    Equal<
      ServerDataFrom<
        () => { set: Set<string>; readonlySet: ReadonlySet<string> }
      >,
      { set: Set<string>; readonlySet: ReadonlySet<string> }
    >
  >,

  // ClientDataFrom
  Expect<Equal<ClientDataFrom<any>, undefined>>,
  Expect<
    Equal<
      ClientDataFrom<() => { a: string; b: Date; c: () => boolean }>,
      { a: string; b: Date; c: () => boolean }
    >
  >,
  Expect<
    Equal<
      Pretty<
        ClientDataFrom<
          () =>
            | { json: string; b: Date; c: () => boolean }
            | DataWithResponseInit<{ data: string; b: Date; c: () => boolean }>
        >
      >,
      | { json: string; b: Date; c: () => boolean }
      | { data: string; b: Date; c: () => boolean }
    >
  >,
  Expect<Equal<ClientDataFrom<() => { a: string } | Response>, { a: string }>>,

  // GetLoaderData
  Expect<Equal<GetLoaderData<{}>, undefined>>,
  Expect<
    Equal<
      GetLoaderData<{
        loader: () => { a: string; b: Date; c: () => boolean };
      }>,
      { a: string; b: Date; c: undefined }
    >
  >,
  Expect<
    Equal<
      GetLoaderData<{
        clientLoader: () => { a: string; b: Date; c: () => boolean };
      }>,
      { a: string; b: Date; c: () => boolean }
    >
  >,
  Expect<
    Equal<
      GetLoaderData<{
        loader: () => { a: string; b: Date; c: () => boolean };
        clientLoader: () => { d: string; e: Date; f: () => boolean };
      }>,
      | { a: string; b: Date; c: undefined }
      | { d: string; e: Date; f: () => boolean }
    >
  >,
  Expect<
    Equal<
      GetLoaderData<{
        loader: () => { a: string; b: Date; c: () => boolean };
        clientLoader: () => { d: string; e: Date; f: () => boolean };
        HydrateFallback: () => unknown;
      }>,
      | { a: string; b: Date; c: undefined }
      | { d: string; e: Date; f: () => boolean }
    >
  >,
  Expect<
    Equal<
      GetLoaderData<{
        loader: () => { a: string; b: Date; c: () => boolean };
        clientLoader: (() => { d: string; e: Date; f: () => boolean }) & {
          hydrate: true;
        };
      }>,
      | { a: string; b: Date; c: undefined }
      | { d: string; e: Date; f: () => boolean }
    >
  >,
  Expect<
    Equal<
      GetLoaderData<{
        loader: () => { a: string; b: Date; c: () => boolean };
        clientLoader: (() => { d: string; e: Date; f: () => boolean }) & {
          hydrate: true;
        };
        HydrateFallback: () => unknown;
      }>,
      { d: string; e: Date; f: () => boolean }
    >
  >,

  // ActionData
  Expect<Equal<GetActionData<{}>, undefined>>,
  Expect<
    Equal<
      GetActionData<{
        action: () => { a: string; b: Date; c: () => boolean };
      }>,
      { a: string; b: Date; c: undefined }
    >
  >,
  Expect<
    Equal<
      GetActionData<{
        clientAction: () => { a: string; b: Date; c: () => boolean };
      }>,
      { a: string; b: Date; c: () => boolean }
    >
  >,
  Expect<
    Equal<
      GetActionData<{
        action: () => { a: string; b: Date; c: () => boolean };
        clientAction: () => { d: string; e: Date; f: () => boolean };
      }>,
      | { a: string; b: Date; c: undefined }
      | { d: string; e: Date; f: () => boolean }
    >
  >,
];
