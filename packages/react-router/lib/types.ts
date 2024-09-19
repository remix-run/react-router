import type { AppLoadContext } from "./server-runtime/data";
import type { Serializable } from "./server-runtime/single-fetch";

// prettier-ignore
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false
type IsAny<T> = 0 extends 1 & T ? true : false;
type IsDefined<T> = Equal<T, undefined> extends true ? false : true;
type Fn = (...args: any[]) => unknown;

type RouteModule = {
  loader?: Fn;
  clientLoader?: Fn;
  action?: Fn;
  clientAction?: Fn;
  HydrateFallback?: unknown;
  default?: unknown;
  ErrorBoundary?: unknown;
};

export type LoaderData<T extends RouteModule> = _LoaderData<
  Serialize<DataFrom<T["loader"]>>,
  DataFrom<T["clientLoader"]>,
  false, // TODO
  IsAny<T["HydrateFallback"]> extends true ? false : true
>;

// prettier-ignore
type _LoaderData<
  ServerLoaderData,
  ClientLoaderData,
  ClientLoaderHydrate extends boolean,
  HasHydrateFallback
> =
  [HasHydrateFallback, ClientLoaderHydrate]  extends [true, true] ?
    IsDefined<ClientLoaderData> extends true ? ClientLoaderData :
    undefined
  :
  [IsDefined<ClientLoaderData>, IsDefined<ServerLoaderData>] extends [true, true] ? ServerLoaderData | ClientLoaderData :
  IsDefined<ClientLoaderData> extends true ?
    ClientLoaderHydrate extends true ? ClientLoaderData :
    ClientLoaderData | undefined
  :
  IsDefined<ServerLoaderData> extends true ? ServerLoaderData :
  undefined

export type ActionData<T extends RouteModule> = _ActionData<
  Serialize<DataFrom<T["action"]>>,
  DataFrom<T["clientAction"]>
>;

// prettier-ignore
type _ActionData<ServerActionData, ClientActionData> = Awaited<
  [IsDefined<ServerActionData>, IsDefined<ClientActionData>] extends [true, true] ? ServerActionData | ClientActionData :
  IsDefined<ClientActionData> extends true ? ClientActionData :
  IsDefined<ServerActionData> extends true ? ServerActionData :
  undefined
>

type DataFunctionArgs<Params> = {
  request: Request;
  params: Params;
  context?: AppLoadContext;
};

// prettier-ignore
type Serialize<T> =
  // First, let type stay as-is if its already serializable...
  T extends Serializable ? T :

  // ...then don't allow functions to be serialized...
  T extends (...args: any[]) => unknown ? undefined :

  // ...lastly handle inner types for all container types allowed by `turbo-stream`

  // Promise
  T extends Promise<infer U> ? Promise<Serialize<U>> :

  // Map & Set
  T extends Map<infer K, infer V> ? Map<Serialize<K>, Serialize<V>> :
  T extends Set<infer U> ? Set<Serialize<U>> :

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
  T extends Fn ? VoidToUndefined<Awaited<ReturnType<T>>> :
  undefined

export type ServerLoader<Params> = {
  args: DataFunctionArgs<Params>;
};

export type ClientLoader<Params, T extends RouteModule> = {
  args: DataFunctionArgs<Params> & {
    serverLoader: () => Promise<Serialize<DataFrom<T["loader"]>>>;
  };
};

export type ServerAction<Params> = {
  args: DataFunctionArgs<Params>;
};

export type ClientAction<Params, T extends RouteModule> = {
  args: DataFunctionArgs<Params> & {
    serverAction: () => Promise<Serialize<DataFrom<T["action"]>>>;
  };
};

export type HydrateFallback<Params> = {
  args: { params: Params };
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  return: import("react").ReactNode;
};

export type Default<Params, LoaderData, ActionData> = {
  args: { params: Params; loaderData: LoaderData; actionData?: ActionData };
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  return: import("react").ReactNode;
};

export type ErrorBoundary<Params, LoaderData, ActionData> = {
  args: {
    params: Params;
    error: unknown;
    loaderData?: LoaderData;
    actionData?: ActionData;
  };
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  return: import("react").ReactNode;
};
