import type { MetaDescriptor } from "../dom/ssr/routeModules";
import type { Location } from "../router/history";
import type { LinkDescriptor } from "../router/links";
import type {
  unstable_MiddlewareNextFunction,
  unstable_RouterContextProvider,
} from "../router/utils";
import type { AppLoadContext } from "../server-runtime/data";
import type { MiddlewareEnabled } from "./future";

import type { ClientDataFrom, ServerDataFrom } from "./route-data";
import type { Equal, Expect, Func, Pretty } from "./utils";

type IsDefined<T> = Equal<T, undefined> extends true ? false : true;
type MaybePromise<T> = T | Promise<T>;

type RouteModule = {
  meta?: Func;
  links?: Func;
  headers?: Func;
  loader?: Func;
  clientLoader?: Func;
  action?: Func;
  clientAction?: Func;
  HydrateFallback?: Func;
  default?: Func;
  ErrorBoundary?: Func;
  [key: string]: unknown; // allow user-defined exports
};

type Props = {
  params: unknown;
  loaderData: unknown;
  actionData: unknown;
};

type RouteInfo = Props & {
  parents: Props[];
  module: RouteModule;
};

type MetaMatch<T extends Props> = Pretty<
  Pick<T, "params"> & {
    pathname: string;
    meta: MetaDescriptor[];
    data: T["loaderData"];
    handle?: unknown;
    error?: unknown;
  }
>;

// prettier-ignore
type MetaMatches<T extends Props[]> =
  T extends [infer F extends Props, ...infer R extends Props[]]
    ? [MetaMatch<F>, ...MetaMatches<R>]
    : Array<MetaMatch<RouteInfo> | undefined>;

type CreateMetaArgs<T extends RouteInfo> = {
  /** This is the current router `Location` object. This is useful for generating tags for routes at specific paths or query parameters. */
  location: Location;
  /** {@link https://reactrouter.com/start/framework/routing#dynamic-segments Dynamic route params} for the current route. */
  params: T["params"];
  /** The return value for this route's server loader function */
  data: T["loaderData"];
  /** Thrown errors that trigger error boundaries will be passed to the meta function. This is useful for generating metadata for error pages. */
  error?: unknown;
  /** An array of the current {@link https://api.reactrouter.com/v7/interfaces/react_router.UIMatch.html route matches}, including parent route matches. */
  matches: MetaMatches<[...T["parents"], T]>;
};
type MetaDescriptors = MetaDescriptor[];

type HeadersArgs = {
  loaderHeaders: Headers;
  parentHeaders: Headers;
  actionHeaders: Headers;
  errorHeaders: Headers | undefined;
};

// prettier-ignore
type IsHydrate<ClientLoader> =
  ClientLoader extends { hydrate: true } ? true :
  ClientLoader extends { hydrate: false } ? false :
  false

export type CreateLoaderData<T extends RouteModule> = _CreateLoaderData<
  ServerDataFrom<T["loader"]>,
  ClientDataFrom<T["clientLoader"]>,
  IsHydrate<T["clientLoader"]>,
  T extends { HydrateFallback: Func } ? true : false
>;

// prettier-ignore
type _CreateLoaderData<
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

export type CreateActionData<T extends RouteModule> = _CreateActionData<
  ServerDataFrom<T["action"]>,
  ClientDataFrom<T["clientAction"]>
>;

// prettier-ignore
type _CreateActionData<ServerActionData, ClientActionData> = Awaited<
  [IsDefined<ServerActionData>, IsDefined<ClientActionData>] extends [true, true] ? ServerActionData | ClientActionData :
  IsDefined<ClientActionData> extends true ? ClientActionData :
  IsDefined<ServerActionData> extends true ? ServerActionData :
  undefined
>

type ClientDataFunctionArgs<T extends RouteInfo> = {
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
  params: T["params"];
  /**
   * This is a `RouterContextProvider` instance generated from your router's
   * `unstable_getContext` function and/or populated from route middleware
   * functions.
   */
  context: MiddlewareEnabled extends true
    ? unstable_RouterContextProvider
    : undefined;
};

type ServerDataFunctionArgs<T extends RouteInfo> = {
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
  params: T["params"];
  /**
   * Without `future.unstable_middleware` enabled, this is the context passed in
   * to your server adapter's `getLoadContext` function. It's a way to bridge the
   * gap between the adapter's request/response API with your React Router app.
   * It is only applicable if you are using a custom server adapter.
   *
   * With `future.unstable_middleware` enabled, this is an instance of
   * `unstable_RouterContextProvider` and can be used for type-safe access to
   * context value set in your route middlewares.  If you are using a custom
   * server adapter, you may provide an initial set of context values from your
   * `getLoadContext` function.
   */
  context: MiddlewareEnabled extends true
    ? unstable_RouterContextProvider
    : AppLoadContext;
};

type CreateServerMiddlewareFunction<T extends RouteInfo> = (
  args: ServerDataFunctionArgs<T>,
  next: unstable_MiddlewareNextFunction<Response>
) => MaybePromise<Response | void>;

type CreateClientMiddlewareFunction<T extends RouteInfo> = (
  args: ClientDataFunctionArgs<T>,
  next: unstable_MiddlewareNextFunction<undefined>
) => MaybePromise<void>;

type CreateServerLoaderArgs<T extends RouteInfo> = ServerDataFunctionArgs<T>;

type CreateClientLoaderArgs<T extends RouteInfo> = ClientDataFunctionArgs<T> & {
  /** This is an asynchronous function to get the data from the server loader for this route. On client-side navigations, this will make a {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API fetch} call to the React Router server loader. If you opt-into running your clientLoader on hydration, then this function will return the data that was already loaded on the server (via Promise.resolve). */
  serverLoader: () => Promise<ServerDataFrom<T["module"]["loader"]>>;
};

type CreateServerActionArgs<T extends RouteInfo> = ServerDataFunctionArgs<T>;

type CreateClientActionArgs<T extends RouteInfo> = ClientDataFunctionArgs<T> & {
  /** This is an asynchronous function that makes the {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API fetch} call to the React Router server action for this route. */
  serverAction: () => Promise<ServerDataFrom<T["module"]["action"]>>;
};

type CreateHydrateFallbackProps<T extends RouteInfo> = {
  params: T["params"];
  loaderData?: T["loaderData"];
  actionData?: T["actionData"];
};

type Match<T extends Props> = Pretty<
  Pick<T, "params"> & {
    pathname: string;
    data: T["loaderData"];
    handle: unknown;
  }
>;

// prettier-ignore
type Matches<T extends Props[]> =
  T extends [infer F extends Props, ...infer R extends Props[]]
    ? [Match<F>, ...Matches<R>]
    : Array<Match<Props> | undefined>;

type CreateComponentProps<T extends RouteInfo> = {
  /**
   * {@link https://reactrouter.com/start/framework/routing#dynamic-segments Dynamic route params} for the current route.
   * @example
   * // app/routes.ts
   * route("teams/:teamId", "./team.tsx"),
   *
   * // app/team.tsx
   * export default function Component({
   *   params,
   * }: Route.ComponentProps) {
   *   params.teamId;
   *   //        ^ string
   * }
   **/
  params: T["params"];
  /** The data returned from the `loader` or `clientLoader` */
  loaderData: T["loaderData"];
  /** The data returned from the `action` or `clientAction` following an action submission. */
  actionData?: T["actionData"];
  /** An array of the current {@link https://api.reactrouter.com/v7/interfaces/react_router.UIMatch.html route matches}, including parent route matches. */
  matches: Matches<[...T["parents"], T]>;
};

type CreateErrorBoundaryProps<T extends RouteInfo> = {
  /**
   * {@link https://reactrouter.com/start/framework/routing#dynamic-segments Dynamic route params} for the current route.
   * @example
   * // app/routes.ts
   * route("teams/:teamId", "./team.tsx"),
   *
   * // app/team.tsx
   * export function ErrorBoundary({
   *   params,
   * }: Route.ErrorBoundaryProps) {
   *   params.teamId;
   *   //        ^ string
   * }
   **/
  params: T["params"];
  error: unknown;
  loaderData?: T["loaderData"];
  actionData?: T["actionData"];
};

export type RouteModuleAnnotations<Info extends RouteInfo> = {
  // links
  LinkDescriptors: LinkDescriptor[];
  LinksFunction: () => LinkDescriptor[];

  // meta
  MetaArgs: CreateMetaArgs<Info>;
  MetaDescriptors: MetaDescriptors;
  MetaFunction: (args: CreateMetaArgs<Info>) => MetaDescriptors;

  // headers
  HeadersArgs: HeadersArgs;
  HeadersFunction: (args: HeadersArgs) => Headers | HeadersInit;

  // middleware
  unstable_MiddlewareFunction: CreateServerMiddlewareFunction<Info>;

  // clientMiddleware
  unstable_ClientMiddlewareFunction: CreateClientMiddlewareFunction<Info>;

  // loader
  LoaderArgs: CreateServerLoaderArgs<Info>;

  // clientLoader
  ClientLoaderArgs: CreateClientLoaderArgs<Info>;

  // action
  ActionArgs: CreateServerActionArgs<Info>;

  // clientAction
  ClientActionArgs: CreateClientActionArgs<Info>;

  // HydrateFallback
  HydrateFallbackProps: CreateHydrateFallbackProps<Info>;

  // default (Component)
  ComponentProps: CreateComponentProps<Info>;

  // ErrorBoundary
  ErrorBoundaryProps: CreateErrorBoundaryProps<Info>;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type __tests = [
  // LoaderData
  Expect<Equal<CreateLoaderData<{}>, undefined>>,
  Expect<
    Equal<
      CreateLoaderData<{
        loader: () => { a: string; b: Date; c: () => boolean };
      }>,
      { a: string; b: Date; c: undefined }
    >
  >,
  Expect<
    Equal<
      CreateLoaderData<{
        clientLoader: () => { a: string; b: Date; c: () => boolean };
      }>,
      { a: string; b: Date; c: () => boolean }
    >
  >,
  Expect<
    Equal<
      CreateLoaderData<{
        loader: () => { a: string; b: Date; c: () => boolean };
        clientLoader: () => { d: string; e: Date; f: () => boolean };
      }>,
      | { a: string; b: Date; c: undefined }
      | { d: string; e: Date; f: () => boolean }
    >
  >,
  Expect<
    Equal<
      CreateLoaderData<{
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
      CreateLoaderData<{
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
      CreateLoaderData<{
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
  Expect<Equal<CreateActionData<{}>, undefined>>,
  Expect<
    Equal<
      CreateActionData<{
        action: () => { a: string; b: Date; c: () => boolean };
      }>,
      { a: string; b: Date; c: undefined }
    >
  >,
  Expect<
    Equal<
      CreateActionData<{
        clientAction: () => { a: string; b: Date; c: () => boolean };
      }>,
      { a: string; b: Date; c: () => boolean }
    >
  >,
  Expect<
    Equal<
      CreateActionData<{
        action: () => { a: string; b: Date; c: () => boolean };
        clientAction: () => { d: string; e: Date; f: () => boolean };
      }>,
      | { a: string; b: Date; c: undefined }
      | { d: string; e: Date; f: () => boolean }
    >
  >
];
