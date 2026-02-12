import type { AppLoadContext } from "../server-runtime/data";
import type { RequestHandler } from "../server-runtime/server";
import type { MiddlewareEnabled } from "../types/future";
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
export type unstable_ServerInstrumentation = {
  handler?: unstable_InstrumentRequestHandlerFunction;
  route?: unstable_InstrumentRouteFunction;
};

export type unstable_ClientInstrumentation = {
  router?: unstable_InstrumentRouterFunction;
  route?: unstable_InstrumentRouteFunction;
};

export type unstable_InstrumentRequestHandlerFunction = (
  handler: InstrumentableRequestHandler,
) => void;

export type unstable_InstrumentRouterFunction = (
  router: InstrumentableRouter,
) => void;

export type unstable_InstrumentRouteFunction = (
  route: InstrumentableRoute,
) => void;

export type unstable_InstrumentationHandlerResult =
  | { status: "success"; error: undefined }
  | { status: "error"; error: Error };

// Shared
type InstrumentFunction<T> = (
  handler: () => Promise<unstable_InstrumentationHandlerResult>,
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

type ReadonlyContext = MiddlewareEnabled extends true
  ? Pick<RouterContextProvider, "get">
  : Readonly<AppLoadContext>;

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

type RouteHandlerInstrumentationInfo = Readonly<{
  request: ReadonlyRequest;
  params: LoaderFunctionArgs["params"];
  unstable_pattern: string;
  context: ReadonlyContext;
}>;

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

export function getRouteInstrumentationUpdates(
  fns: unstable_InstrumentRouteFunction[],
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
        let keys = Object.keys(aggregated) as Array<keyof typeof aggregated>;
        for (let key of keys) {
          if (i[key]) {
            aggregated[key].push(i[key] as any);
          }
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
      updates.lazy = instrumented as DataRouteObject["lazy"];
    }
  }

  // Instrument the lazy object format
  if (typeof route.lazy === "object") {
    let lazyObject: LazyRouteObject<DataRouteObject> = route.lazy;
    (["middleware", "loader", "action"] as const).forEach((key) => {
      let lazyFn = lazyObject[key];
      let instrumentations = aggregated[`lazy.${key}`];
      if (typeof lazyFn === "function" && instrumentations.length > 0) {
        let instrumented = wrapImpl(instrumentations, lazyFn, () => undefined);
        if (instrumented) {
          updates.lazy = Object.assign(updates.lazy || {}, {
            [key]: instrumented,
          });
        }
      }
    });
  }

  // Instrument loader/action functions
  (["loader", "action"] as const).forEach((key) => {
    let handler = route[key];
    if (typeof handler === "function" && aggregated[key].length > 0) {
      // @ts-expect-error
      let original = handler[UninstrumentedSymbol] ?? handler;
      let instrumented = wrapImpl(aggregated[key], original, (...args) =>
        getHandlerInfo(args[0] as LoaderFunctionArgs | ActionFunctionArgs),
      );
      if (instrumented) {
        if (key === "loader" && original.hydrate === true) {
          (instrumented as LoaderFunction).hydrate = true;
        }
        // @ts-expect-error
        instrumented[UninstrumentedSymbol] = original;
        updates[key] = instrumented;
      }
    }
  });

  // Instrument middleware functions
  if (
    route.middleware &&
    route.middleware.length > 0 &&
    aggregated.middleware.length > 0
  ) {
    updates.middleware = route.middleware.map((middleware) => {
      // @ts-expect-error
      let original = middleware[UninstrumentedSymbol] ?? middleware;
      let instrumented = wrapImpl(aggregated.middleware, original, (...args) =>
        getHandlerInfo(args[0] as Parameters<MiddlewareFunction>[0]),
      );
      if (instrumented) {
        // @ts-expect-error
        instrumented[UninstrumentedSymbol] = original;
        return instrumented;
      }
      return middleware;
    });
  }

  return updates;
}

export function instrumentClientSideRouter(
  router: Router,
  fns: unstable_InstrumentRouterFunction[],
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
        let keys = Object.keys(i) as Array<keyof RouterInstrumentations>;
        for (let key of keys) {
          if (i[key]) {
            aggregated[key].push(i[key] as any);
          }
        }
      },
    }),
  );

  if (aggregated.navigate.length > 0) {
    // @ts-expect-error
    let navigate = router.navigate[UninstrumentedSymbol] ?? router.navigate;
    let instrumentedNavigate = wrapImpl(
      aggregated.navigate,
      navigate,
      (...args) => {
        let [to, opts] = args as Parameters<Router["navigate"]>;
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
    ) as Router["navigate"];
    if (instrumentedNavigate) {
      // @ts-expect-error
      instrumentedNavigate[UninstrumentedSymbol] = navigate;
      router.navigate = instrumentedNavigate;
    }
  }

  if (aggregated.fetch.length > 0) {
    // @ts-expect-error
    let fetch = router.fetch[UninstrumentedSymbol] ?? router.fetch;
    let instrumentedFetch = wrapImpl(aggregated.fetch, fetch, (...args) => {
      let [key, , href, opts] = args as Parameters<Router["fetch"]>;
      return {
        href: href ?? ".",
        fetcherKey: key,
        ...getRouterInfo(router, opts ?? {}),
      } satisfies RouterFetchInstrumentationInfo;
    }) as Router["fetch"];
    if (instrumentedFetch) {
      // @ts-expect-error
      instrumentedFetch[UninstrumentedSymbol] = fetch;
      router.fetch = instrumentedFetch;
    }
  }

  return router;
}

export function instrumentHandler(
  handler: RequestHandler,
  fns: unstable_InstrumentRequestHandlerFunction[],
): RequestHandler {
  let aggregated: {
    request: InstrumentFunction<RequestHandlerInstrumentationInfo>[];
  } = {
    request: [],
  };

  fns.forEach((fn) =>
    fn({
      instrument(i) {
        let keys = Object.keys(i) as Array<keyof typeof i>;
        for (let key of keys) {
          if (i[key]) {
            aggregated[key].push(i[key] as any);
          }
        }
      },
    }),
  );

  let instrumentedHandler = handler;

  if (aggregated.request.length > 0) {
    instrumentedHandler = wrapImpl(aggregated.request, handler, (...args) => {
      let [request, context] = args as Parameters<RequestHandler>;
      return {
        request: getReadonlyRequest(request),
        context: context != null ? getReadonlyContext(context) : context,
      } satisfies RequestHandlerInstrumentationInfo;
    }) as RequestHandler;
  }

  return instrumentedHandler;
}

function wrapImpl<T extends InstrumentationInfo>(
  impls: InstrumentFunction<T>[],
  handler: (...args: any[]) => MaybePromise<any>,
  getInfo: (...args: unknown[]) => T,
) {
  if (impls.length === 0) {
    return null;
  }
  return async (...args: unknown[]) => {
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

type RecurseResult = { type: "success" | "error"; value: unknown };

async function recurseRight<T extends InstrumentationInfo>(
  impls: InstrumentFunction<T>[],
  info: T,
  handler: () => MaybePromise<void>,
  index: number,
): Promise<RecurseResult> {
  let impl = impls[index];
  let result: RecurseResult | undefined;
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
    let handlerPromise: ReturnType<typeof recurseRight> | undefined = undefined;
    let callHandler =
      async (): Promise<unstable_InstrumentationHandlerResult> => {
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
  let { request, context, params, unstable_pattern } = args;
  return {
    request: getReadonlyRequest(request),
    params: { ...params },
    unstable_pattern,
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
  context: MiddlewareEnabled extends true
    ? RouterContextProvider
    : AppLoadContext,
): MiddlewareEnabled extends true
  ? Pick<RouterContextProvider, "get">
  : Readonly<AppLoadContext> {
  if (isPlainObject(context)) {
    let frozen = { ...context };
    Object.freeze(frozen);
    return frozen;
  } else {
    return {
      get: <T>(ctx: RouterContext<T>) =>
        (context as unknown as RouterContextProvider).get(ctx),
    };
  }
}

// From turbo-stream-v2/flatten.ts
const objectProtoNames = Object.getOwnPropertyNames(Object.prototype)
  .sort()
  .join("\0");

function isPlainObject(
  thing: unknown,
): thing is Record<string | number | symbol, unknown> {
  if (thing === null || typeof thing !== "object") {
    return false;
  }
  const proto = Object.getPrototypeOf(thing);
  return (
    proto === Object.prototype ||
    proto === null ||
    Object.getOwnPropertyNames(proto).sort().join("\0") === objectProtoNames
  );
}
