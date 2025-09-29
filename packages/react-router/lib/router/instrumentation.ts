import type {
  AgnosticDataRouteObject,
  LazyRouteObject,
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

type InstrumentLazyFunction = (handler: () => Promise<void>) => Promise<void>;

type InstrumentHandlerFunction = (
  handler: () => Promise<void>,
  info: InstrumentationInfo,
) => MaybePromise<void>;

type Instrumentations = {
  lazy?: InstrumentLazyFunction;
  "lazy.loader"?: InstrumentLazyFunction;
  "lazy.action"?: InstrumentLazyFunction;
  "lazy.middleware"?: InstrumentLazyFunction;
  middleware?: InstrumentHandlerFunction;
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

function getInstrumentedImplementation(
  impls: Instrumentations[keyof Instrumentations][],
  handler: (...args: any[]) => Promise<any>,
) {
  if (impls.length === 0) {
    return null;
  }
  return async (arg1: any, arg2?: any) => {
    let value: unknown;
    let info = arg1 != null ? getInstrumentationInfo(arg1) : undefined;
    await recurseRight(
      impls,
      info,
      async () => {
        value = arg1 == null ? await handler() : await handler(arg1, arg2);
      },
      impls.length - 1,
    );
    return value;
  };
}

async function recurseRight(
  impls: Instrumentations[keyof Instrumentations][],
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

function getInstrumentationsByType<T extends keyof Instrumentations>(
  instrumentations: Instrumentations[],
  key: T,
): Instrumentations[T][] {
  let value: Instrumentations[T][] = [];
  for (let i in instrumentations) {
    let instrumentation = instrumentations[i];
    if (key in instrumentation && instrumentation[key] != null) {
      value.push(instrumentation[key]!);
    }
  }
  return value;
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
    // Instrument lazy, loader, and action functions
    (["lazy", "loader", "action"] as const).forEach((key) => {
      let func = route[key as "loader" | "action"];
      if (typeof func === "function") {
        // @ts-expect-error
        let original = func[UninstrumentedSymbol] ?? func;
        let instrumented = getInstrumentedImplementation(
          getInstrumentationsByType(instrumentations, key),
          original,
        );
        if (instrumented) {
          // @ts-expect-error
          instrumented[UninstrumentedSymbol] = original;
          updates[key] = instrumented;
        }
      }
    });

    // Instrument middleware functions
    if (route.middleware && route.middleware.length > 0) {
      route.middleware = route.middleware.map((middleware) => {
        // @ts-expect-error
        let original = middleware[UninstrumentedSymbol] ?? middleware;
        let instrumented = getInstrumentedImplementation(
          getInstrumentationsByType(instrumentations, "middleware"),
          original,
        );
        if (instrumented) {
          // @ts-expect-error
          instrumented[UninstrumentedSymbol] = original;
          return instrumented;
        }
        return middleware;
      });
    }

    // Instrument the lazy object format
    if (typeof route.lazy === "object") {
      let lazyObject: LazyRouteObject<AgnosticDataRouteObject> = route.lazy;
      (["middleware", "loader", "action"] as const).forEach((key) => {
        let func = lazyObject[key];
        if (typeof func === "function") {
          let instrumented = getInstrumentedImplementation(
            getInstrumentationsByType(instrumentations, `lazy.${key}`),
            func,
          );
          if (instrumented) {
            updates.lazy = Object.assign(updates.lazy || {}, {
              [key]: instrumented,
            });
          }
        }
      });
    }
  }
  return updates;
}
