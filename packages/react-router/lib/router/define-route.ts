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
) => MaybePromise<Serializable>;

// action
type ActionArgs<Param extends string> = {
  context: Context;
  request: Request;
  params: Record<Param, string>;
  response: ResponseStub;
};
export type Action<Param extends string> = (
  args: ActionArgs<Param>
) => MaybePromise<Serializable>;

type Component<P extends string, L extends Loader<P>> = (args: {
  params: string extends P ? Record<never, string> : Record<P, string>;
  data: Awaited<ReturnType<L>>;
}) => ReactNode;

// loader -> data for component
// loader -> serverLoader for clientLoader -> data for component
// TODO: clientLoader and all the other route module export APIs (meta, handle, ErrorBoundary, etc.)
export const defineRoute$ = <
  const P extends string,
  L extends Loader<P>,
  A extends Action<P>
>(route: {
  params?: P[];
  loader?: L;
  action?: A;
  Component?: Component<NoInfer<P>, NoInfer<L>>;
}) => route;
