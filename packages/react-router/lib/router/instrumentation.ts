import type {
  ActionFunction,
  AgnosticDataRouteObject,
  LoaderFunction,
  LoaderFunctionArgs,
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

type Instrumentations = {
  loader?: InstrumentHandlerFunction;
  action?: InstrumentHandlerFunction;
};

type InstrumentableRoute = {
  id: string;
  index: boolean | undefined;
  path: string | undefined;
  instrument(instrumentations: Instrumentations): void;
};

export type unstable_InstrumentRouteFunction = (
  route: InstrumentableRoute,
) => void;

function getInstrumentedHandler<H extends LoaderFunction | ActionFunction>(
  impls: InstrumentHandlerFunction[],
  handler: H,
) {
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
    await composed(getInstrumentationInfo(args[0]));
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
  let updates: {
    loader?: LoaderFunction;
    action?: ActionFunction;
  } = {};
  let instrumentations: Instrumentations[] = [];
  unstable_instrumentRoute({
    id: route.id,
    index: route.index,
    path: route.path,
    instrument(i) {
      instrumentations.push(i);
    },
  });
  if (instrumentations.length > 0) {
    if (typeof route.loader === "function") {
      let instrumented = getInstrumentedHandler(
        instrumentations
          .map((i) => i.loader)
          .filter(Boolean) as InstrumentHandlerFunction[],
        route.loader,
      );
      if (instrumented) {
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
