import type { ReactNode } from "react";

import type { MetaDescriptor, MetaMatch } from "../dom/ssr/routeModules";
import type { LinkDescriptor } from "../dom/ssr/links";
import type { Location } from "./history";

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

// === TESTS ===

// prettier-ignore
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false
function expectEqual<T, U>(_: Equal<T, U>) {}

type ExpectedParams = {
  [key: string]: string | undefined;
  id: string;
  brand?: string;
};
defineRoute({
  params: ["id", "brand?"],
  links({ params }) {
    expectEqual<typeof params, ExpectedParams>(true);
    return [];
  },
  HydrateFallback({ params }) {
    expectEqual<typeof params, ExpectedParams>(true);
    return null;
  },
  serverLoader({ params }) {
    expectEqual<typeof params, ExpectedParams>(true);
    return null;
  },
  clientLoader({ params }) {
    expectEqual<typeof params, ExpectedParams>(true);
    return null;
  },
  serverAction({ params }) {
    expectEqual<typeof params, ExpectedParams>(true);
    return null;
  },
  clientAction({ params }) {
    expectEqual<typeof params, ExpectedParams>(true);
    return null;
  },
  meta({ params }) {
    expectEqual<typeof params, ExpectedParams>(true);
    return [];
  },
  Component({ params }) {
    expectEqual<typeof params, ExpectedParams>(true);
    return null;
  },
  ErrorBoundary({ params }) {
    expectEqual<typeof params, ExpectedParams>(true);
    return null;
  },
});

// Loader data: no loaders -> undefined
defineRoute({
  meta({ loaderData }) {
    expectEqual<typeof loaderData, undefined>(true);
    return [];
  },
  Component({ loaderData }) {
    expectEqual<typeof loaderData, undefined>(true);
    return null;
  },
  ErrorBoundary({ loaderData }) {
    expectEqual<typeof loaderData, undefined>(true);
    return null;
  },
});

// Loader data: server -> server
defineRoute({
  serverLoader() {
    return 1;
  },
  meta({ loaderData }) {
    expectEqual<typeof loaderData, 1 | undefined>(true);
    return [];
  },
  Component({ loaderData }) {
    expectEqual<typeof loaderData, 1>(true);
    return null;
  },
  ErrorBoundary({ loaderData }) {
    expectEqual<typeof loaderData, 1 | undefined>(true);
    return null;
  },
});

// Loader data: server + client -> server | client
defineRoute({
  serverLoader() {
    return 1;
  },
  async clientLoader({ serverLoader }) {
    let serverData = await serverLoader();
    expectEqual<typeof serverData, 1>(true);
    return 2 as const;
  },
  meta({ loaderData }) {
    expectEqual<typeof loaderData, 1 | 2 | undefined>(true);
    return [];
  },
  Component({ loaderData }) {
    expectEqual<typeof loaderData, 1 | 2>(true);
    return null;
  },
  ErrorBoundary({ loaderData }) {
    expectEqual<typeof loaderData, 1 | 2 | undefined>(true);
    return null;
  },
});

// Loader data: server + client + hydrate -> server | client
defineRoute({
  serverLoader() {
    return 1;
  },
  async clientLoader({ serverLoader }) {
    let serverData = await serverLoader();
    expectEqual<typeof serverData, 1>(true);
    return 2 as const;
  },
  clientLoaderHydrate: true,
  meta({ loaderData }) {
    expectEqual<typeof loaderData, 1 | 2 | undefined>(true);
    return [];
  },
  Component({ loaderData }) {
    expectEqual<typeof loaderData, 1 | 2>(true);
    return null;
  },
  ErrorBoundary({ loaderData }) {
    expectEqual<typeof loaderData, 1 | 2 | undefined>(true);
    return null;
  },
});

// Loader data: server + client + hydrate + hydratefallback -> client
defineRoute({
  serverLoader() {
    return 1;
  },
  async clientLoader({ serverLoader }) {
    let serverData = await serverLoader();
    expectEqual<typeof serverData, 1>(true);
    return 2 as const;
  },
  clientLoaderHydrate: true,
  HydrateFallback() {
    return null;
  },
  meta({ loaderData }) {
    expectEqual<typeof loaderData, 2 | undefined>(true);
    return [];
  },
  Component({ loaderData }) {
    expectEqual<typeof loaderData, 2>(true);
    return null;
  },
  ErrorBoundary({ loaderData }) {
    expectEqual<typeof loaderData, 2 | undefined>(true);
    return null;
  },
});

// Loader data: client + hydrate + hydratefallback -> client
defineRoute({
  async clientLoader({ serverLoader }) {
    expectEqual<typeof serverLoader, undefined>(true);
    return 2 as const;
  },
  clientLoaderHydrate: true,
  HydrateFallback() {
    return null;
  },
  meta({ loaderData }) {
    expectEqual<typeof loaderData, 2 | undefined>(true);
    return [];
  },
  Component({ loaderData }) {
    expectEqual<typeof loaderData, 2>(true);
    return null;
  },
  ErrorBoundary({ loaderData }) {
    expectEqual<typeof loaderData, 2 | undefined>(true);
    return null;
  },
});

// Loader data: client + hydrate + -> client
defineRoute({
  async clientLoader({ serverLoader }) {
    expectEqual<typeof serverLoader, undefined>(true);
    return 2 as const;
  },
  clientLoaderHydrate: true,
  meta({ loaderData }) {
    expectEqual<typeof loaderData, 2 | undefined>(true);
    return [];
  },
  Component({ loaderData }) {
    expectEqual<typeof loaderData, 2>(true);
    return null;
  },
  ErrorBoundary({ loaderData }) {
    expectEqual<typeof loaderData, 2 | undefined>(true);
    return null;
  },
});

// action: neither, server, client, both

// Action data: no actions -> undefined
defineRoute({
  Component({ actionData }) {
    expectEqual<typeof actionData, undefined>(true);
    return null;
  },
  ErrorBoundary({ actionData }) {
    expectEqual<typeof actionData, undefined>(true);
    return null;
  },
});

// Action data: server -> server
defineRoute({
  serverAction() {
    return 1;
  },
  Component({ actionData }) {
    expectEqual<typeof actionData, 1 | undefined>(true);
    return null;
  },
  ErrorBoundary({ actionData }) {
    expectEqual<typeof actionData, 1 | undefined>(true);
    return null;
  },
});

// Action data: client -> client
defineRoute({
  clientAction({ serverAction }) {
    expectEqual<typeof serverAction, undefined>(true);
    return 2;
  },
  Component({ actionData }) {
    expectEqual<typeof actionData, 2 | undefined>(true);
    return null;
  },
  ErrorBoundary({ actionData }) {
    expectEqual<typeof actionData, 2 | undefined>(true);
    return null;
  },
});

// Action data: server + client -> client
defineRoute({
  serverAction() {
    return 1;
  },
  clientAction() {
    return 2;
  },
  Component({ actionData }) {
    expectEqual<typeof actionData, 2 | undefined>(true);
    return null;
  },
  ErrorBoundary({ actionData }) {
    expectEqual<typeof actionData, 2 | undefined>(true);
    return null;
  },
});
