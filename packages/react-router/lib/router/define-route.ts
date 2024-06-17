import type { ReactNode } from "react";
import type { DataRouteMatch } from "../context";
import type { MetaDescriptor, RouteHandle } from "../dom/ssr/routeModules";
import type { Location } from "./history";
import type { UIMatch } from "./utils";
import type { LinkDescriptor } from "../dom/ssr/links";

// TODO: return interfaces for `Data`
// TODO: HMR
// TODO: allow widest type (branded type: NOT_SET)

interface Context {} // TODO: AppLoadContext

type MaybePromise<T> = T | Promise<T>;
type Pretty<T> = { [K in keyof T]: T[K] } & {};

type Serializable =
  | undefined
  | null
  | boolean
  | string
  | symbol
  | number
  | Array<Serializable>
  | { [key: PropertyKey]: Serializable }
  | bigint
  | Date
  | URL
  | RegExp
  | Error
  | Map<Serializable, Serializable>
  | Set<Serializable>
  | Promise<Serializable>;

type Data = MaybePromise<
  Exclude<Serializable, undefined | Promise<Serializable>>
>;

export type ResponseStub = {
  status: number | undefined;
  headers: Headers;
};

// loader
type LoaderArgs<Param extends string> = {
  context: Context;
  request: Request;
  params: Params<Param>;
  response: ResponseStub;
};

// action
type ActionArgs<Param extends string> = {
  context: Context;
  request: Request;
  params: Params<Param>;
  response: ResponseStub;
};

// prettier-ignore
type Params<Param extends string> = Pretty<
  & {[key: string]: string | undefined}
  & {[K in Param as K extends `${string}?` ? never : K]: string}
  & {[K in Param as K extends `${infer P}?` ? P : never]?: string}
>

type IsDefined<T> = undefined extends T ? false : true;

// prettier-ignore
type _LoaderData<
  ServerLoaderData,
  ClientLoaderData,
  ClientLoaderHydrate extends boolean,
  HydrateFallback,
> = Awaited<
  [IsDefined<HydrateFallback>, ClientLoaderHydrate]  extends [true, true] ?
    IsDefined<ClientLoaderData> extends true ? ClientLoaderData :
    undefined
  :
  [IsDefined<ClientLoaderData>, IsDefined<ServerLoaderData>] extends [true, true] ? ServerLoaderData | ClientLoaderData :
  IsDefined<ClientLoaderData> extends true ?
    IsDefined<ClientLoaderHydrate> extends true ? ClientLoaderData :
    ClientLoaderData | undefined
  :
  IsDefined<ServerLoaderData> extends true ? ServerLoaderData :
  undefined
>

type LoaderData<
  ServerLoaderData,
  ClientLoaderData,
  ClientLoaderHydrate extends boolean,
  HydrateFallback
> = _LoaderData<
  Awaited<ServerLoaderData>,
  Awaited<ClientLoaderData>,
  ClientLoaderHydrate,
  HydrateFallback
>;

// prettier-ignore
type ActionData<ServerActionData, ClientActionData> = Awaited<
  IsDefined<ClientActionData> extends true ? ClientActionData :
  IsDefined<ServerActionData> extends true ? ServerActionData :
  undefined
>

type HydrateFallbackComponent<Param extends string> = (args: {
  params: Params<Param>;
}) => ReactNode;

type Route<
  Param extends string,
  ServerLoaderData extends Data | undefined,
  ClientLoaderData extends Data | undefined,
  ClientLoaderHydrate extends boolean,
  HydrateFallback extends HydrateFallbackComponent<Param> | undefined,
  ServerActionData extends Data | undefined,
  ClientActionData extends Data | undefined
> = {
  params?: Param[];
  links?: (args: { params: Params<Param> }) => LinkDescriptor[];
  HydrateFallback?: HydrateFallback;

  serverLoader?: (args: LoaderArgs<Param>) => ServerLoaderData;
  clientLoader?: (
    args: LoaderArgs<Param> & {
      serverLoader: IsDefined<ServerLoaderData> extends true
        ? () => Promise<Awaited<ServerLoaderData>>
        : undefined;
    }
  ) => ClientLoaderData;
  clientLoaderHydrate?: ClientLoaderHydrate;

  serverAction?: (args: ActionArgs<Param>) => ServerActionData;
  clientAction?: (
    args: ActionArgs<Param> & {
      serverAction: IsDefined<ServerActionData> extends true
        ? () => Promise<Awaited<ServerActionData>>
        : undefined;
    }
  ) => ClientActionData;

  meta?: (args: {
    params: Params<Param>;
    location: Location;
    error: unknown;
    loaderData?: LoaderData<
      ServerLoaderData,
      ClientLoaderData,
      ClientLoaderHydrate,
      HydrateFallback
    >;
    matches?: Array<MetaMatch>;
  }) => MetaDescriptor[];

  Component?: (args: {
    params: Params<Param>;
    loaderData: LoaderData<
      ServerLoaderData,
      ClientLoaderData,
      ClientLoaderHydrate,
      HydrateFallback
    >;
    actionData?: ActionData<ServerActionData, ClientActionData>;
  }) => ReactNode;
  ErrorBoundary?: (args: {
    params: Params<Param>;
    error: unknown;
    loaderData?: LoaderData<
      ServerLoaderData,
      ClientLoaderData,
      ClientLoaderHydrate,
      HydrateFallback
    >;
    actionData?: ActionData<ServerActionData, ClientActionData>;
  }) => ReactNode;

  handle?: unknown;
};

export function defineRoute<
  const Param extends string,
  ServerLoaderData extends Data | undefined,
  ClientLoaderData extends Data | undefined,
  ClientLoaderHydrate extends boolean,
  HydrateFallback extends HydrateFallbackComponent<Param> | undefined,
  ServerActionData extends Data | undefined,
  ClientActionData extends Data | undefined,
  T
>(
  route: T &
    Route<
      Param,
      ServerLoaderData,
      ClientLoaderData,
      ClientLoaderHydrate,
      HydrateFallback,
      ServerActionData,
      ClientActionData
    >
): T {
  return route;
}

export function defineRootRoute<
  const Param extends string,
  ServerLoaderData extends Data | undefined,
  ClientLoaderData extends Data | undefined,
  ClientLoaderHydrate extends boolean,
  HydrateFallback extends HydrateFallbackComponent<Param> | undefined,
  ServerActionData extends Data | undefined,
  ClientActionData extends Data | undefined,
  T
>(
  route: T &
    Route<
      Param,
      ServerLoaderData,
      ClientLoaderData,
      ClientLoaderHydrate,
      HydrateFallback,
      ServerActionData,
      ClientActionData
    > & {
      Layout: (args: {
        params: Params<Param>;
        error: unknown;
        loaderData?: LoaderData<
          ServerLoaderData,
          ClientLoaderData,
          ClientLoaderHydrate,
          HydrateFallback
        >;
        actionData?: ActionData<ServerActionData, ClientActionData>;
      }) => ReactNode;
    }
): T {
  return route;
}

type MetaMatch<RouteId extends string = string, Data = unknown> = {
  id: RouteId;
  pathname: DataRouteMatch["pathname"];
  data: Data;
  handle?: RouteHandle;
  params: DataRouteMatch["params"];
  meta: MetaDescriptor[];
  error?: unknown;
};

export type MetaMatches<
  Routes extends Record<string, Route<any, any, any, any, any, any, any>>
> = Pretty<
  Array<
    Pretty<
      {
        [K in keyof Routes]: MetaMatch<
          Exclude<K, number | symbol>,
          LoaderDataFromRoute<Routes[K]>
        >;
      }[keyof Routes]
    >
  >
>;

type LoaderDataFromRoute<R> = R extends Route<
  any,
  infer ServerLoaderData,
  infer ClientLoaderData,
  infer ClientLoaderHydrate,
  infer HydrateFallback,
  any,
  any
>
  ? LoaderData<
      ServerLoaderData,
      ClientLoaderData,
      ClientLoaderHydrate,
      HydrateFallback
    >
  : never;

export type Matches<
  Routes extends Record<string, Route<any, any, any, any, any, any, any>>
> = Pretty<
  Array<
    Pretty<
      {
        [K in keyof Routes]: { id: K } & UIMatch<
          LoaderDataFromRoute<Routes[K]>
        >;
      }[keyof Routes]
    >
  >
>;

let route1 = defineRoute({
  serverLoader: () => ({ hello: "world", project: "cool" }),
});
let route2 = defineRoute({
  serverLoader: () => ({ goodbye: "planet", project: "sad" }),
});

type X = MetaMatches<{
  route1: typeof route1;
  route2: typeof route2;
}>;

// defineRoute({
//   meta({ matches }) {
//     let typedMatches = matches as MetaMatches<{
//       route1: typeof route1;
//       route2: typeof route2;
//     }>;
//     let project = typedMatches.find((match) => match.id === "route1")?.data
//       .project;
//     return [];
//   },
//   Component() {
//     let matches: Matches<{
//       route1: typeof route1;
//       route2: typeof route2;
//     }> = {} as any;
//     console.log(matches);
//     let match = matches[0];
//     if (match.id === "route1") {
//       let x = match.data.hello;
//     }
//     return "";
//   },
// });
