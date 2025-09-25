import type {
  ActionFunction,
  AgnosticDataRouteObject,
  LazyRouteFunction,
  LoaderFunction,
  LoaderFunctionArgs,
  MaybePromise,
  RouterContextProvider,
} from "./utils";

type InstrumentationInfo = Readonly<{
  request: {
    method: string;
    url: string;
    headers: Pick<Headers, "get">;
  };
  params: LoaderFunctionArgs["params"];
  pattern: string;
  // TODO: Fix for non-middleware
  context: Pick<RouterContextProvider, "get">;
}>;

type InstrumentHandlerFunction = (
  handler: () => undefined,
  info: InstrumentationInfo,
) => MaybePromise<void>;

type InstrumentLazyFunction = (
  handler: () => undefined,
  info: InstrumentationInfo,
) => MaybePromise<void>;

type Instrumentations = {
  lazy?: InstrumentLazyFunction;
  loader?: InstrumentHandlerFunction;
  action?: InstrumentHandlerFunction;
};

type InstrumentableRoute = {
  id: string;
  index: boolean | undefined;
  path: string | undefined;
  instrument(instrumentations: Instrumentations): void;
};

const UninstrumentedSymbol = Symbol("Uninstrumented");

export type unstable_InstrumentRouteFunction = (
  route: InstrumentableRoute,
) => void;

function getInstrumentedHandler<
  H extends
    | LazyRouteFunction<AgnosticDataRouteObject>
    | LoaderFunction
    | ActionFunction,
>(impls: InstrumentHandlerFunction[], handler: H): H | null {
  if (impls.length === 0) {
    return null;
  }
  return async (...args: Parameters<H>) => {
    let value;
    let composed = impls.reduce(
      (acc, fn) => (i) => fn(acc as () => undefined, i),
      async () => {
        value = await handler(...args);
      },
    ) as unknown as (info: InstrumentationInfo) => Promise<void>;
    let composedArgs = args[0] ? [getInstrumentationInfo(args[0])] : [];
    await composed(...composedArgs);
    return value;
  };
}

function getInstrumentationInfo(args: LoaderFunctionArgs): InstrumentationInfo {
  let { request, context, params, pattern } = args;
  return {
    // pseudo "Request" with the info they may want to read from
    request: {
      method: request.method,
      url: request.url,
      // Maybe make this a proxy that only supports `get`?
      headers: {
        get: (...args) => request.headers.get(...args),
      },
    },
    params: { ...params },
    pattern,
    context: {
      get: (...args: Parameters<RouterContextProvider["get"]>) =>
        context.get(...args),
    },
  };
}

export function getInstrumentationUpdates(
  unstable_instrumentRoute: unstable_InstrumentRouteFunction,
  route: AgnosticDataRouteObject,
) {
  let instrumentations: Instrumentations[] = [];
  unstable_instrumentRoute({
    id: route.id,
    index: route.index,
    path: route.path,
    instrument(i) {
      instrumentations.push(i);
    },
  });

  let updates: {
    loader?: AgnosticDataRouteObject["loader"];
    action?: AgnosticDataRouteObject["action"];
    lazy?: AgnosticDataRouteObject["lazy"];
  } = {};

  if (instrumentations.length > 0) {
    if (typeof route.lazy === "function") {
      let instrumented = getInstrumentedHandler(
        instrumentations
          .map((i) => i.lazy)
          .filter(Boolean) as InstrumentHandlerFunction[],
        route.lazy,
      );
      if (instrumented) {
        updates.lazy = instrumented;
      }
    }

    if (typeof route.loader === "function") {
      // @ts-expect-error
      let original = route.loader[UninstrumentedSymbol] ?? route.loader;
      let instrumented = getInstrumentedHandler(
        instrumentations
          .map((i) => i.loader)
          .filter(Boolean) as InstrumentHandlerFunction[],
        original,
      );
      if (instrumented) {
        // @ts-expect-error Avoid double-instrumentation on lazy calls to
        // `mapRouteProperties`
        instrumented[UninstrumentedSymbol] = original;
        updates.loader = instrumented;
      }
    }

    if (typeof route.action === "function") {
      let instrumented = getInstrumentedHandler(
        instrumentations
          .map((i) => i.action)
          .filter(Boolean) as InstrumentHandlerFunction[],
        route.action,
      );
      if (instrumented) {
        updates.action = instrumented;
      }
    }
  }
  return updates;
}
