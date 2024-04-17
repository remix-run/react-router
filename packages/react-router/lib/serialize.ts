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

export type Params<Key extends string = string> = {
  readonly [key in Key]: string | undefined;
};

// TODO: rename to `Context` or `DataContext` or `AppContext`?
interface AppLoadContext {}

type MaybePromise<T> = T | Promise<T>;

type DataFunction = (
  args: {
    request: Request;
    params: Params;
    context?: AppLoadContext;
  },
  handlerCtx?: unknown
) => MaybePromise<Response | Serializable | null>;

// prettier-ignore
export type Data<T extends DataFunction> =
  Awaited<ReturnType<T>> extends Response ? never :
  Awaited<ReturnType<T>>

export type Loader = DataFunction & { hydrate?: boolean };
export type Action = DataFunction;

export const defineLoader = <T extends Loader>(
  loader: T,
  options: { hydrate?: boolean } = {}
): T => {
  loader.hydrate = options.hydrate;
  return loader;
};

export const defineAction = <T extends Action>(action: T): T => action;
