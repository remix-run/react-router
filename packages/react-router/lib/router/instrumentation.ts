import type {
  ActionFunction,
  AgnosticDataRouteObject,
  LazyRouteFunction,
  LoaderFunction,
  LoaderFunctionArgs,
  MaybePromise,
  MiddlewareFunction,
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
  handler: () => Promise<void>,
  info: InstrumentationInfo,
) => MaybePromise<void>;

type InstrumentLazyFunction = (handler: () => Promise<void>) => Promise<void>;

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
    | LoaderFunction<RouterContextProvider>
    | ActionFunction<RouterContextProvider>,
>(impls: InstrumentHandlerFunction[], handler: H): H | null {
  if (impls.length === 0) {
    return null;
  }
  return (async (args, ctx?) => {
    let value;
    await recurseRight(
      impls,
      getInstrumentationInfo(args),
      async () => {
        value = await handler(args, ctx);
      },
      impls.length - 1,
    );
    return value;
  }) as H;
}

function getInstrumentedLazy(
  impls: InstrumentLazyFunction[],
  handler: LazyRouteFunction<AgnosticDataRouteObject>,
): LazyRouteFunction<AgnosticDataRouteObject> | null {
  if (impls.length === 0) {
    return null;
  }
  return (async () => {
    let value;
    await recurseRight(
      impls,
      undefined,
      async () => {
        value = await handler();
      },
      impls.length - 1,
    );
    return value;
  }) as unknown as LazyRouteFunction<AgnosticDataRouteObject>;
}

async function recurseRight(
  impls: InstrumentHandlerFunction[] | InstrumentLazyFunction[],
  info: InstrumentationInfo | undefined,
  handler: () => MaybePromise<void>,
  index: number,
): Promise<void> {
  let impl = impls[index];
  if (!impl) {
    await handler();
  } else if (info) {
    await impl(async () => {
      await recurseRight(impls, info, handler, index - 1);
    }, info);
  } else {
    await (impl as InstrumentLazyFunction)(async () => {
      await recurseRight(impls, info, handler, index - 1);
    });
  }
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
      let instrumented = getInstrumentedLazy(
        instrumentations
          .map((i) => i.lazy)
          .filter(Boolean) as InstrumentLazyFunction[],
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
        instrumented[UninstrumentedSymbol] = original;
        updates.loader = instrumented;
      }
    }

    if (typeof route.action === "function") {
      // @ts-expect-error
      let original = route.action[UninstrumentedSymbol] ?? route.action;
      let instrumented = getInstrumentedHandler(
        instrumentations
          .map((i) => i.action)
          .filter(Boolean) as InstrumentHandlerFunction[],
        original,
      );
      if (instrumented) {
        instrumented[UninstrumentedSymbol] = original;
        updates.action = instrumented;
      }
    }
  }
  return updates;
}
