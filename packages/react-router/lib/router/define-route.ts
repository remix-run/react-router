import type { ReactNode } from "react";

interface Context {} // TODO: AppLoadContext?

type MaybePromise<T> = T | Promise<T>;

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

export type TypedResponse<T = unknown> = Omit<Response, "json"> & {
  json(): Promise<T>;
};

type DataFunctionReturnValue =
  | Serializable
  // TODO: | TypedDeferredData<Record<string, unknown>> // do we want to allow `defer()` for back compat?
  | TypedResponse<Record<string, unknown>>;

// TODO: clientLoader and all the other route module export APIs (meta, handle, ErrorBoundary, etc.)

export type ResponseStub = {
  status: number | undefined;
  headers: Headers;
};

// loader
type LoaderArgs<Param extends string> = {
  context: Context;
  request: Request;
  params: Record<Param, string>;
  response: ResponseStub;
};
export type Loader<Param extends string> = (
  args: LoaderArgs<Param>
) => MaybePromise<DataFunctionReturnValue>;

// action
type ActionArgs<Param extends string> = {
  context: Context;
  request: Request;
  params: Record<Param, string>;
  response: ResponseStub;
};
export type Action<Param extends string> = (
  args: ActionArgs<Param>
) => MaybePromise<DataFunctionReturnValue>;

type Component<P extends string, L extends Loader<P>> = (args: {
  params: string extends P ? Record<never, string> : Record<P, string>;
  data: Awaited<ReturnType<L>>;
}) => ReactNode;

export const defineRoute$ = <
  const P extends string,
  L extends Loader<P>,
  A extends Action<P>
>(route: {
  params?: P[];
  loader?: L;
  action?: A;
  component?: Component<NoInfer<P>, NoInfer<L>>;
}) => route;
