import type { RequestHandler } from "../server-runtime/server";
import { createPath, invariant } from "./history";
import type { Router } from "./router";
import type {
  ActionFunctionArgs,
  DataRouteObject,
  FormEncType,
  HTMLFormMethod,
  LazyRouteObject,
  LoaderFunction,
  LoaderFunctionArgs,
  MaybePromise,
  MiddlewareFunction,
  RouterContext,
  RouterContextProvider,
} from "./utils";

// Public APIs
export type ServerInstrumentation = {
  handler?: InstrumentRequestHandlerFunction;
  route?: InstrumentRouteFunction;
};

export type ClientInstrumentation = {
  router?: InstrumentRouterFunction;
  route?: InstrumentRouteFunction;
};

export type InstrumentRequestHandlerFunction = (
  handler: InstrumentableRequestHandler,
) => void;

export type InstrumentRouterFunction = (router: InstrumentableRouter) => void;

export type InstrumentRouteFunction = (route: InstrumentableRoute) => void;

export type InstrumentationHandlerResult =
  | { status: "success"; error: undefined }
  | { status: "error"; error: Error };

// Shared
type InstrumentFunction<T> = (
  handler: () => Promise<InstrumentationHandlerResult>,
  info: T,
) => Promise<void>;

type InstrumentationInfo =
  | RouteLazyInstrumentationInfo
  | RouteHandlerInstrumentationInfo
  | RouterNavigationInstrumentationInfo
  | RouterFetchInstrumentationInfo
  | RequestHandlerInstrumentationInfo;

type ReadonlyRequest = {
  method: string;
  url: string;
  headers: Pick<Headers, "get">;
};

type ReadonlyContext = Pick<RouterContextProvider, "get">;

// Route Instrumentation
type InstrumentableRoute = {
  id: string;
  index: boolean | undefined;
  path: string | undefined;
  instrument(instrumentations: RouteInstrumentations): void;
};

type RouteInstrumentations = {
  lazy?: InstrumentFunction<RouteLazyInstrumentationInfo>;
  "lazy.loader"?: InstrumentFunction<RouteLazyInstrumentationInfo>;
  "lazy.action"?: InstrumentFunction<RouteLazyInstrumentationInfo>;
  "lazy.middleware"?: InstrumentFunction<RouteLazyInstrumentationInfo>;
  middleware?: InstrumentFunction<RouteHandlerInstrumentationInfo>;
  loader?: InstrumentFunction<RouteHandlerInstrumentationInfo>;
  action?: InstrumentFunction<RouteHandlerInstrumentationInfo>;
};

type RouteLazyInstrumentationInfo = undefined;

type RouteHandlerInstrumentationInfo = Readonly<
  Omit<LoaderFunctionArgs, "request" | "context"> & {
    request: ReadonlyRequest;
    context: ReadonlyContext;
  }
>;

// Router Instrumentation
type InstrumentableRouter = {
  instrument(instrumentations: RouterInstrumentations): void;
};

type RouterInstrumentations = {
  navigate?: InstrumentFunction<RouterNavigationInstrumentationInfo>;
  fetch?: InstrumentFunction<RouterFetchInstrumentationInfo>;
};

type RouterNavigationInstrumentationInfo = Readonly<{
  to: string | number;
  currentUrl: string;
  formMethod?: HTMLFormMethod;
  formEncType?: FormEncType;
  formData?: FormData;
  body?: any;
}>;

type RouterFetchInstrumentationInfo = Readonly<{
  href: string;
  currentUrl: string;
  fetcherKey: string;
  formMethod?: HTMLFormMethod;
  formEncType?: FormEncType;
  formData?: FormData;
  body?: any;
}>;

// Request Handler Instrumentation
type InstrumentableRequestHandler = {
  instrument(instrumentations: RequestHandlerInstrumentations): void;
};

type RequestHandlerInstrumentations = {
  request?: InstrumentFunction<RequestHandlerInstrumentationInfo>;
};

type RequestHandlerInstrumentationInfo = Readonly<{
  request: ReadonlyRequest;
  context: ReadonlyContext | undefined;
}>;

const UninstrumentedSymbol = Symbol("Uninstrumented");
type InstrumentableFunction = (...args: never[]) => MaybePromise<unknown>;
type InstrumentedFunction<T extends InstrumentableFunction> = T & {
  [UninstrumentedSymbol]?: T;
};

export function getRouteInstrumentationUpdates(
  fns: InstrumentRouteFunction[],
  route: Readonly<DataRouteObject>,
) {
  let aggregated: {
    lazy: InstrumentFunction<RouteLazyInstrumentationInfo>[];
    "lazy.loader": InstrumentFunction<RouteLazyInstrumentationInfo>[];
    "lazy.action": InstrumentFunction<RouteLazyInstrumentationInfo>[];
    "lazy.middleware": InstrumentFunction<RouteLazyInstrumentationInfo>[];
    middleware: InstrumentFunction<RouteHandlerInstrumentationInfo>[];
    loader: InstrumentFunction<RouteHandlerInstrumentationInfo>[];
    action: InstrumentFunction<RouteHandlerInstrumentationInfo>[];
  } = {
    lazy: [],
    "lazy.loader": [],
    "lazy.action": [],
    "lazy.middleware": [],
    middleware: [],
    loader: [],
    action: [],
  };

  fns.forEach((fn) =>
    fn({
      id: route.id,
      index: route.index,
      path: route.path,
      instrument(i) {
        if (i.lazy != null) {
          aggregated.lazy.push(i.lazy);
        }
        if (i["lazy.loader"] != null) {
          aggregated["lazy.loader"].push(i["lazy.loader"]);
        }
        if (i["lazy.action"] != null) {
          aggregated["lazy.action"].push(i["lazy.action"]);
        }
        if (i["lazy.middleware"] != null) {
          aggregated["lazy.middleware"].push(i["lazy.middleware"]);
        }
        if (i.middleware != null) {
          aggregated.middleware.push(i.middleware);
        }
        if (i.loader != null) {
          aggregated.loader.push(i.loader);
        }
        if (i.action != null) {
          aggregated.action.push(i.action);
        }
      },
    }),
  );

  let updates: {
    middleware?: DataRouteObject["middleware"];
    loader?: DataRouteObject["loader"];
    action?: DataRouteObject["action"];
    lazy?: DataRouteObject["lazy"];
  } = {};

  // Instrument lazy functions
  if (typeof route.lazy === "function" && aggregated.lazy.length > 0) {
    let instrumented = wrapImpl(aggregated.lazy, route.lazy, () => undefined);
    if (instrumented) {
      updates.lazy = instrumented;
    }
  }

  // Instrument the lazy object format
  if (typeof route.lazy === "object") {
    let lazyObject: LazyRouteObject<DataRouteObject> = route.lazy;

    if (
      typeof lazyObject.middleware === "function" &&
      aggregated["lazy.middleware"].length > 0
    ) {
      let instrumented = wrapImpl(
        aggregated["lazy.middleware"],
        lazyObject.middleware,
        () => undefined,
      );
      if (instrumented) {
        updates.lazy = Object.assign(updates.lazy || {}, {
          middleware: instrumented,
        });
      }
    }

    if (
      typeof lazyObject.loader === "function" &&
      aggregated["lazy.loader"].length > 0
    ) {
      let instrumented = wrapImpl(
        aggregated["lazy.loader"],
        lazyObject.loader,
        () => undefined,
      );
      if (instrumented) {
        updates.lazy = Object.assign(updates.lazy || {}, {
          loader: instrumented,
        });
      }
    }

    if (
      typeof lazyObject.action === "function" &&
      aggregated["lazy.action"].length > 0
    ) {
      let instrumented = wrapImpl(
        aggregated["lazy.action"],
        lazyObject.action,
        () => undefined,
      );
      if (instrumented) {
        updates.lazy = Object.assign(updates.lazy || {}, {
          action: instrumented,
        });
      }
    }
  }

  // Instrument loader/action functions
  if (typeof route.loader === "function" && aggregated.loader.length > 0) {
    let original = getUninstrumentedHandler(route.loader);
    let instrumented = wrapImpl(aggregated.loader, original, (args) =>
      getHandlerInfo(args),
    );
    if (instrumented) {
      if (original.hydrate === true) {
        (instrumented as LoaderFunction).hydrate = true;
      }
      setUninstrumentedHandler(instrumented, original);
      updates.loader = instrumented;
    }
  }

  if (typeof route.action === "function" && aggregated.action.length > 0) {
    let original = getUninstrumentedHandler(route.action);
    let instrumented = wrapImpl(aggregated.action, original, (args) =>
      getHandlerInfo(args),
    );
    if (instrumented) {
      setUninstrumentedHandler(instrumented, original);
      updates.action = instrumented;
    }
  }

  // Instrument middleware functions
  if (
    route.middleware &&
    route.middleware.length > 0 &&
    aggregated.middleware.length > 0
  ) {
    updates.middleware = route.middleware.map((middleware) => {
      let original = getUninstrumentedHandler(middleware);
      let instrumented = wrapImpl(aggregated.middleware, original, (args) =>
        getHandlerInfo(args),
      );
      if (instrumented) {
        setUninstrumentedHandler(instrumented, original);
        return instrumented;
      }
      return middleware;
    });
  }

  return updates;
}

export function instrumentClientSideRouter(
  router: Router,
  fns: InstrumentRouterFunction[],
): Router {
  let aggregated: {
    navigate: InstrumentFunction<RouterNavigationInstrumentationInfo>[];
    fetch: InstrumentFunction<RouterFetchInstrumentationInfo>[];
  } = {
    navigate: [],
    fetch: [],
  };

  fns.forEach((fn) =>
    fn({
      instrument(i) {
        if (i.navigate != null) {
          aggregated.navigate.push(i.navigate);
        }
        if (i.fetch != null) {
          aggregated.fetch.push(i.fetch);
        }
      },
    }),
  );

  if (aggregated.navigate.length > 0) {
    let navigate = getUninstrumentedHandler(router.navigate);
    let instrumentedNavigate = wrapImpl(
      aggregated.navigate,
      navigate,
      (to, opts) => {
        return {
          to:
            typeof to === "number" || typeof to === "string"
              ? to
              : to
                ? createPath(to)
                : ".",
          ...getRouterInfo(router, opts ?? {}),
        } satisfies RouterNavigationInstrumentationInfo;
      },
    );
    if (instrumentedNavigate) {
      setUninstrumentedHandler(instrumentedNavigate, navigate);
      router.navigate = instrumentedNavigate as Router["navigate"];
    }
  }

  if (aggregated.fetch.length > 0) {
    let fetch = getUninstrumentedHandler(router.fetch);
    let instrumentedFetch = wrapImpl(
      aggregated.fetch,
      fetch,
      (key, _, href, opts) => {
        return {
          href: href ?? ".",
          fetcherKey: key,
          ...getRouterInfo(router, opts ?? {}),
        } satisfies RouterFetchInstrumentationInfo;
      },
    );
    if (instrumentedFetch) {
      setUninstrumentedHandler(instrumentedFetch, fetch);
      router.fetch = instrumentedFetch;
    }
  }

  return router;
}

export function instrumentHandler(
  handler: RequestHandler,
  fns: InstrumentRequestHandlerFunction[],
): RequestHandler {
  let aggregated: {
    request: InstrumentFunction<RequestHandlerInstrumentationInfo>[];
  } = {
    request: [],
  };

  fns.forEach((fn) =>
    fn({
      instrument(i) {
        if (i.request != null) {
          aggregated.request.push(i.request);
        }
      },
    }),
  );

  let instrumentedHandler = handler;

  if (aggregated.request.length > 0) {
    let instrumented = wrapImpl(
      aggregated.request,
      handler,
      (request, context) => {
        return {
          request: getReadonlyRequest(request),
          context: context != null ? getReadonlyContext(context) : context,
        } satisfies RequestHandlerInstrumentationInfo;
      },
    );
    if (instrumented) {
      instrumentedHandler = instrumented;
    }
  }

  return instrumentedHandler;
}

function getUninstrumentedHandler<T extends InstrumentableFunction>(
  handler: T,
): T {
  return (handler as InstrumentedFunction<T>)[UninstrumentedSymbol] ?? handler;
}

function setUninstrumentedHandler<TArgs extends unknown[], TResult>(
  handler: (...args: TArgs) => MaybePromise<TResult>,
  uninstrumentedHandler: (...args: TArgs) => MaybePromise<TResult>,
) {
  (handler as InstrumentedFunction<(...args: TArgs) => MaybePromise<TResult>>)[
    UninstrumentedSymbol
  ] = uninstrumentedHandler;
}

function wrapImpl<
  TArgs extends unknown[],
  TResult,
  TInfo extends InstrumentationInfo,
>(
  impls: InstrumentFunction<TInfo>[],
  handler: (...args: TArgs) => MaybePromise<TResult>,
  getInfo: (...args: TArgs) => TInfo,
) {
  if (impls.length === 0) {
    return null;
  }
  return async (...args: TArgs): Promise<TResult> => {
    let result = await recurseRight(
      impls,
      getInfo(...args),
      () => handler(...args),
      impls.length - 1,
    );
    if (result.type === "error") {
      throw result.value;
    }
    return result.value;
  };
}

type RecurseResult<TResult> =
  | { type: "success"; value: TResult }
  | { type: "error"; value: unknown };

async function recurseRight<TResult, TInfo extends InstrumentationInfo>(
  impls: InstrumentFunction<TInfo>[],
  info: TInfo,
  handler: () => MaybePromise<TResult>,
  index: number,
): Promise<RecurseResult<TResult>> {
  let impl = impls[index];
  let result: RecurseResult<TResult> | undefined;
  if (!impl) {
    try {
      let value = await handler();
      result = { type: "success", value };
    } catch (e) {
      result = { type: "error", value: e };
    }
  } else {
    // If they forget to call the handler, or if they throw before calling the
    // handler, we need to ensure the handlers still gets called
    let handlerPromise: Promise<RecurseResult<TResult>> | undefined = undefined;
    let callHandler = async (): Promise<InstrumentationHandlerResult> => {
      if (handlerPromise) {
        console.error("You cannot call instrumented handlers more than once");
      } else {
        handlerPromise = recurseRight(impls, info, handler, index - 1);
      }
      result = await handlerPromise;
      invariant(result, "Expected a result");
      if (result.type === "error" && result.value instanceof Error) {
        return { status: "error", error: result.value };
      }
      return { status: "success", error: undefined };
    };

    try {
      await impl(callHandler, info);
    } catch (e) {
      console.error("An instrumentation function threw an error:", e);
    }

    if (!handlerPromise) {
      await callHandler();
    }

    // If the user forgot to await the handler, we can wait for it to resolve here
    await handlerPromise;
  }

  if (result) {
    return result;
  }

  return {
    type: "error",
    value: new Error("No result assigned in instrumentation chain."),
  };
}

function getHandlerInfo(
  args:
    | LoaderFunctionArgs
    | ActionFunctionArgs
    | Parameters<MiddlewareFunction>[0],
): RouteHandlerInstrumentationInfo {
  let { request, context, params } = args;
  return {
    ...args,
    request: getReadonlyRequest(request),
    params: { ...params },
    context: getReadonlyContext(context),
  };
}

function getRouterInfo(
  router: Router,
  opts: NonNullable<
    Parameters<Router["navigate"]>[1] | Parameters<Router["fetch"]>[3]
  >,
) {
  return {
    currentUrl: createPath(router.state.location),
    ...("formMethod" in opts ? { formMethod: opts.formMethod } : {}),
    ...("formEncType" in opts ? { formEncType: opts.formEncType } : {}),
    ...("formData" in opts ? { formData: opts.formData } : {}),
    ...("body" in opts ? { body: opts.body } : {}),
  };
}
// Return a shallow readonly "clone" of the Request with the info they may
// want to read from during instrumentation
function getReadonlyRequest(request: Request): {
  method: string;
  url: string;
  headers: Pick<Headers, "get">;
} {
  return {
    method: request.method,
    url: request.url,
    headers: {
      get: (...args) => request.headers.get(...args),
    },
  };
}

function getReadonlyContext(
  context: Readonly<RouterContextProvider>,
): Pick<RouterContextProvider, "get"> {
  return {
    get: <T>(ctx: RouterContext<T>) => context.get(ctx),
  };
}
