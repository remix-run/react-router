import { R as RouteModule, t as LinkDescriptor, L as Location, u as Func, v as Pretty, w as MetaDescriptor, G as GetLoaderData, x as ServerDataFunctionArgs, y as MiddlewareNextFunction, z as ClientDataFunctionArgs, B as DataStrategyResult, E as ServerDataFrom, N as Normalize, I as GetActionData } from '../../routeModules-CA7kSxJJ.js';
import { R as RouteFiles, P as Pages } from '../../register-CkcGwv27.js';
import 'react';

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
    /** @deprecated Use `MetaMatch.loaderData` instead */
    data: GetLoaderData<T["module"]>;
    loaderData: GetLoaderData<T["module"]>;
    handle?: unknown;
    error?: unknown;
}>;
type MetaMatches<T extends Array<MatchInfo>> = T extends [infer F extends MatchInfo, ...infer R extends Array<MatchInfo>] ? [MetaMatch<F>, ...MetaMatches<R>] : Array<MetaMatch<MatchInfo> | undefined>;
type HasErrorBoundary<T extends RouteInfo> = T["module"] extends {
    ErrorBoundary: Func;
} ? true : false;
type CreateMetaArgs<T extends RouteInfo> = {
    /** This is the current router `Location` object. This is useful for generating tags for routes at specific paths or query parameters. */
    location: Location;
    /** {@link https://reactrouter.com/start/framework/routing#dynamic-segments Dynamic route params} for the current route. */
    params: T["params"];
    /**
     * The return value for this route's server loader function
     *
     * @deprecated Use `Route.MetaArgs.loaderData` instead
     */
    data: T["loaderData"] | (HasErrorBoundary<T> extends true ? undefined : never);
    /** The return value for this route's server loader function */
    loaderData: T["loaderData"] | (HasErrorBoundary<T> extends true ? undefined : never);
    /** Thrown errors that trigger error boundaries will be passed to the meta function. This is useful for generating metadata for error pages. */
    error?: unknown;
    /** An array of the current {@link https://api.reactrouter.com/v7/interfaces/react-router.UIMatch.html route matches}, including parent route matches. */
    matches: MetaMatches<T["matches"]>;
};
type MetaDescriptors = MetaDescriptor[];
type HeadersArgs = {
    loaderHeaders: Headers;
    parentHeaders: Headers;
    actionHeaders: Headers;
    errorHeaders: Headers | undefined;
};
type CreateServerMiddlewareFunction<T extends RouteInfo> = (args: ServerDataFunctionArgs<T["params"]>, next: MiddlewareNextFunction<Response>) => MaybePromise<Response | void>;
type CreateClientMiddlewareFunction<T extends RouteInfo> = (args: ClientDataFunctionArgs<T["params"]>, next: MiddlewareNextFunction<Record<string, DataStrategyResult>>) => MaybePromise<Record<string, DataStrategyResult> | void>;
type CreateServerLoaderArgs<T extends RouteInfo> = ServerDataFunctionArgs<T["params"]>;
type CreateClientLoaderArgs<T extends RouteInfo> = ClientDataFunctionArgs<T["params"]> & {
    /** This is an asynchronous function to get the data from the server loader for this route. On client-side navigations, this will make a {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API fetch} call to the React Router server loader. If you opt-into running your clientLoader on hydration, then this function will return the data that was already loaded on the server (via Promise.resolve). */
    serverLoader: () => Promise<ServerDataFrom<T["module"]["loader"]>>;
};
type CreateServerActionArgs<T extends RouteInfo> = ServerDataFunctionArgs<T["params"]>;
type CreateClientActionArgs<T extends RouteInfo> = ClientDataFunctionArgs<T["params"]> & {
    /** This is an asynchronous function that makes the {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API fetch} call to the React Router server action for this route. */
    serverAction: () => Promise<ServerDataFrom<T["module"]["action"]>>;
};
type CreateHydrateFallbackProps<T extends RouteInfo, RSCEnabled extends boolean> = {
    params: T["params"];
} & (RSCEnabled extends true ? {
    /** The data returned from the `loader` */
    loaderData?: ServerDataFrom<T["module"]["loader"]>;
    /** The data returned from the `action` following an action submission. */
    actionData?: ServerDataFrom<T["module"]["action"]>;
} : {
    /** The data returned from the `loader` or `clientLoader` */
    loaderData?: T["loaderData"];
    /** The data returned from the `action` or `clientAction` following an action submission. */
    actionData?: T["actionData"];
});
type Match<T extends MatchInfo> = Pretty<{
    id: T["id"];
    params: Record<string, string | undefined>;
    pathname: string;
    /** @deprecated Use `Match.loaderData` instead */
    data: GetLoaderData<T["module"]>;
    loaderData: GetLoaderData<T["module"]>;
    handle: unknown;
}>;
type Matches<T extends Array<MatchInfo>> = T extends [infer F extends MatchInfo, ...infer R extends Array<MatchInfo>] ? [Match<F>, ...Matches<R>] : Array<Match<MatchInfo> | undefined>;
type CreateComponentProps<T extends RouteInfo, RSCEnabled extends boolean> = {
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
    /** An array of the current {@link https://api.reactrouter.com/v7/interfaces/react-router.UIMatch.html route matches}, including parent route matches. */
    matches: Matches<T["matches"]>;
} & (RSCEnabled extends true ? {
    /** The data returned from the `loader` */
    loaderData: ServerDataFrom<T["module"]["loader"]>;
    /** The data returned from the `action` following an action submission. */
    actionData?: ServerDataFrom<T["module"]["action"]>;
} : {
    /** The data returned from the `loader` or `clientLoader` */
    loaderData: T["loaderData"];
    /** The data returned from the `action` or `clientAction` following an action submission. */
    actionData?: T["actionData"];
});
type CreateErrorBoundaryProps<T extends RouteInfo, RSCEnabled extends boolean> = {
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
} & (RSCEnabled extends true ? {
    /** The data returned from the `loader` */
    loaderData?: ServerDataFrom<T["module"]["loader"]>;
    /** The data returned from the `action` following an action submission. */
    actionData?: ServerDataFrom<T["module"]["action"]>;
} : {
    /** The data returned from the `loader` or `clientLoader` */
    loaderData?: T["loaderData"];
    /** The data returned from the `action` or `clientAction` following an action submission. */
    actionData?: T["actionData"];
});
type GetAnnotations<Info extends RouteInfo> = {
    LinkDescriptors: LinkDescriptor[];
    LinksFunction: () => LinkDescriptor[];
    MetaArgs: CreateMetaArgs<Info>;
    MetaDescriptors: MetaDescriptors;
    MetaFunction: (args: CreateMetaArgs<Info>) => MetaDescriptors;
    HeadersArgs: HeadersArgs;
    HeadersFunction: (args: HeadersArgs) => Headers | HeadersInit;
    MiddlewareFunction: CreateServerMiddlewareFunction<Info>;
    ClientMiddlewareFunction: CreateClientMiddlewareFunction<Info>;
    LoaderArgs: CreateServerLoaderArgs<Info>;
    ClientLoaderArgs: CreateClientLoaderArgs<Info>;
    ActionArgs: CreateServerActionArgs<Info>;
    ClientActionArgs: CreateClientActionArgs<Info>;
    HydrateFallbackProps: CreateHydrateFallbackProps<Info, false>;
    ServerHydrateFallbackProps: CreateHydrateFallbackProps<Info, true>;
    ComponentProps: CreateComponentProps<Info, false>;
    ServerComponentProps: CreateComponentProps<Info, true>;
    ErrorBoundaryProps: CreateErrorBoundaryProps<Info, false>;
    ServerErrorBoundaryProps: CreateErrorBoundaryProps<Info, true>;
};

type Params<RouteFile extends keyof RouteFiles> = Normalize<Pages[RouteFiles[RouteFile]["page"]]["params"]>;

type GetInfo<T extends {
    file: keyof RouteFiles;
    module: RouteModule;
}> = {
    params: Params<T["file"]>;
    loaderData: GetLoaderData<T["module"]>;
    actionData: GetActionData<T["module"]>;
};

export type { GetAnnotations, GetInfo };
