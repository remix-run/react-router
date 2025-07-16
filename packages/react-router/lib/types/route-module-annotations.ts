import type { MetaDescriptor } from "../dom/ssr/routeModules";
import type { Location } from "../router/history";
import type { LinkDescriptor } from "../router/links";
import type { unstable_MiddlewareNextFunction } from "../router/utils";

import type {
  ClientDataFunctionArgs,
  GetLoaderData,
  ServerDataFrom,
  ServerDataFunctionArgs,
} from "./route-data";
import type { RouteModule } from "./route-module";
import type { Pretty } from "./utils";

type MaybePromise<T> = T | Promise<T>;

type Props = {
  params: unknown;
  loaderData: unknown;
  actionData: unknown;
};

type RouteInfo = Props & {
  module: RouteModule;
  matches: Array<MatchInfo>;
};

type MatchInfo = {
  id: string;
  module: RouteModule;
};

type MetaMatch<T extends MatchInfo> = Pretty<{
  id: T["id"];
  params: Record<string, string | undefined>;
  pathname: string;
  meta: MetaDescriptor[];
  data: GetLoaderData<T["module"]>;
  handle?: unknown;
  error?: unknown;
}>;

// prettier-ignore
type MetaMatches<T extends Array<MatchInfo>> =
  T extends [infer F extends MatchInfo, ...infer R extends Array<MatchInfo>]
    ? [MetaMatch<F>, ...MetaMatches<R>]
    : Array<MetaMatch<MatchInfo> | undefined>;

type CreateMetaArgs<T extends RouteInfo> = {
  /** This is the current router `Location` object. This is useful for generating tags for routes at specific paths or query parameters. */
  location: Location;
  /** {@link https://reactrouter.com/start/framework/routing#dynamic-segments Dynamic route params} for the current route. */
  params: T["params"];
  /** The return value for this route's server loader function */
  data: T["loaderData"] | undefined;
  /** Thrown errors that trigger error boundaries will be passed to the meta function. This is useful for generating metadata for error pages. */
  error?: unknown;
  /** An array of the current {@link https://api.reactrouter.com/v7/interfaces/react_router.UIMatch.html route matches}, including parent route matches. */
  matches: MetaMatches<T["matches"]>;
};
type MetaDescriptors = MetaDescriptor[];

type HeadersArgs = {
  loaderHeaders: Headers;
  parentHeaders: Headers;
  actionHeaders: Headers;
  errorHeaders: Headers | undefined;
};

type CreateServerMiddlewareFunction<T extends RouteInfo> = (
  args: ServerDataFunctionArgs<T["params"]>,
  next: unstable_MiddlewareNextFunction<Response>,
) => MaybePromise<Response | void>;

type CreateClientMiddlewareFunction<T extends RouteInfo> = (
  args: ClientDataFunctionArgs<T["params"]>,
  next: unstable_MiddlewareNextFunction<undefined>,
) => MaybePromise<void>;

type CreateServerLoaderArgs<T extends RouteInfo> = ServerDataFunctionArgs<
  T["params"]
>;

type CreateClientLoaderArgs<T extends RouteInfo> = ClientDataFunctionArgs<
  T["params"]
> & {
  /** This is an asynchronous function to get the data from the server loader for this route. On client-side navigations, this will make a {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API fetch} call to the React Router server loader. If you opt-into running your clientLoader on hydration, then this function will return the data that was already loaded on the server (via Promise.resolve). */
  serverLoader: () => Promise<ServerDataFrom<T["module"]["loader"]>>;
};

type CreateServerActionArgs<T extends RouteInfo> = ServerDataFunctionArgs<
  T["params"]
>;

type CreateClientActionArgs<T extends RouteInfo> = ClientDataFunctionArgs<
  T["params"]
> & {
  /** This is an asynchronous function that makes the {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API fetch} call to the React Router server action for this route. */
  serverAction: () => Promise<ServerDataFrom<T["module"]["action"]>>;
};

type CreateHydrateFallbackProps<T extends RouteInfo> = {
  params: T["params"];
  loaderData?: T["loaderData"];
  actionData?: T["actionData"];
};

type Match<T extends MatchInfo> = Pretty<{
  id: T["id"];
  params: Record<string, string | undefined>;
  pathname: string;
  data: GetLoaderData<T["module"]>;
  handle: unknown;
}>;

// prettier-ignore
type Matches<T extends Array<MatchInfo>> =
  T extends [infer F extends MatchInfo, ...infer R extends Array<MatchInfo>]
    ? [Match<F>, ...Matches<R>]
    : Array<Match<MatchInfo> | undefined>;

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
  matches: Matches<T["matches"]>;
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

export type GetAnnotations<Info extends RouteInfo> = {
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
