import type { MetaDescriptor } from "../dom/ssr/routeModules";
import type { LinkDescriptor } from "../router/links";
import type { AppLoadContext } from "../server-runtime/data";

import type { ClientDataFrom, ServerDataFrom } from "./route-data";
import type { Equal, Expect, Func, Pretty } from "./utils";

type IsDefined<T> = Equal<T, undefined> extends true ? false : true;

type RouteModule = {
  meta?: Func;
  links?: Func;
  loader?: Func;
  clientLoader?: Func;
  action?: Func;
  clientAction?: Func;
  HydrateFallback?: unknown;
  default?: unknown;
  ErrorBoundary?: unknown;
  [key: string]: unknown; // allow user-defined exports
};

export type LinkDescriptors = LinkDescriptor[];

type RouteInfo = {
  id: unknown;
  params: unknown;
  loaderData: unknown;
};

type MetaMatch<T extends RouteInfo> = Pretty<
  Pick<T, "id" | "params"> & {
    pathname: string;
    meta: MetaDescriptor[];
    data: T["loaderData"];
    handle?: unknown;
    error?: unknown;
  }
>;

// prettier-ignore
type MetaMatches<T extends RouteInfo[]> =
  T extends [infer F extends RouteInfo, ...infer R extends RouteInfo[]]
    ? [MetaMatch<F>, ...MetaMatches<R>]
    : [];

export type CreateMetaArgs<Params, LoaderData, Parents extends RouteInfo[]> = {
  location: Location;
  params: Params;
  data: LoaderData;
  error?: unknown;
  matches: MetaMatches<Parents>;
};
export type MetaDescriptors = MetaDescriptor[];

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

type ClientDataFunctionArgs<Params> = {
  request: Request;
  params: Params;
};

type ServerDataFunctionArgs<Params> = ClientDataFunctionArgs<Params> & {
  context: AppLoadContext;
};

export type CreateServerLoaderArgs<Params> = ServerDataFunctionArgs<Params>;

export type CreateClientLoaderArgs<
  Params,
  T extends RouteModule
> = ClientDataFunctionArgs<Params> & {
  serverLoader: () => Promise<ServerDataFrom<T["loader"]>>;
};

export type CreateServerActionArgs<Params> = ServerDataFunctionArgs<Params>;

export type CreateClientActionArgs<
  Params,
  T extends RouteModule
> = ClientDataFunctionArgs<Params> & {
  serverAction: () => Promise<ServerDataFrom<T["action"]>>;
};

export type CreateHydrateFallbackProps<Params> = {
  params: Params;
};

type Match<T extends RouteInfo> = Pretty<
  Pick<T, "id" | "params"> & {
    pathname: string;
    data: T["loaderData"];
    handle: unknown;
  }
>;

// prettier-ignore
type Matches<T extends RouteInfo[]> =
  T extends [infer F extends RouteInfo, ...infer R extends RouteInfo[]]
    ? [Match<F>, ...Matches<R>]
    : [];

export type CreateComponentProps<
  Params,
  LoaderData,
  ActionData,
  Parents extends RouteInfo[]
> = {
  params: Params;
  loaderData: LoaderData;
  actionData?: ActionData;
  matches: Matches<Parents>;
};

export type CreateErrorBoundaryProps<Params, LoaderData, ActionData> = {
  params: Params;
  error: unknown;
  loaderData?: LoaderData;
  actionData?: ActionData;
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
