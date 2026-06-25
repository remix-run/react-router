import type { RequestHandler } from "../server-runtime/server";
import { createPath, invariant } from "./history";
import type { Router } from "./router";
import { createContext, RouterContextProvider } from "./utils";
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

/**
 * Route metadata available after React Router has matched an instrumented
 * request, navigation, or fetcher call.
 */
export type InstrumentationResultMeta = {
  url: LoaderFunctionArgs["url"];
  pattern: string;
  params: LoaderFunctionArgs["params"];
};

/**
 * Result returned by route-level instrumented handler calls, such as
 * instrumented loaders, actions, middleware, and lazy route functions.
 */
export type InstrumentationHandlerResult =
  | { status: "success"; error: undefined }
  | { status: "error"; error: Error };

/**
 * Result returned by client-side router instrumented navigation and fetcher
 * calls.
 */
export type InstrumentationClientRouterResult = InstrumentationHandlerResult & {
  meta: InstrumentationResultMeta | undefined;
};

/**
 * Result returned by server request handler instrumentation.
 */
export type InstrumentationServerHandlerResult =
  InstrumentationHandlerResult & {
    statusCode: number;
    meta: InstrumentationResultMeta | undefined;
  };

export type InstrumentationMetaReceiver = (
  meta: InstrumentationResultMeta | undefined,
) => void;

// Shared
type InstrumentFunction<T, TInnerResult = InstrumentationHandlerResult> = (
  handler: () => Promise<TInnerResult>,
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
  navigate?: InstrumentFunction<
    RouterNavigationInstrumentationInfo,
    InstrumentationClientRouterResult
  >;
  fetch?: InstrumentFunction<
    RouterFetchInstrumentationInfo,
    InstrumentationClientRouterResult
  >;
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
  request?: InstrumentFunction<
    RequestHandlerInstrumentationInfo,
    InstrumentationServerHandlerResult
  >;
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

export const instrumentationResultMetaContext =
  createContext<InstrumentationResultMeta>();

// Client router instrumentations need route metadata captured inside the router
// after matching, but exposing this on public router state/options would make it
// part of the API. Keep a private, one-shot receiver keyed by router instance so
// navigate/fetch instrumentation can receive the metadata without leaking it.
let instrumentationClientResultMetaReceivers = new WeakMap<
  Router,
  InstrumentationMetaReceiver
>();

export function getRouteInstrumentationUpdates(
  fns: InstrumentRouteFunction[],
  route: Readonly<DataRouteObject>,
) {
  let aggregated: {
    lazy: NonNullable<RouteInstrumentations["lazy"]>[];
    "lazy.loader": NonNullable<RouteInstrumentations["lazy.loader"]>[];
    "lazy.action": NonNullable<RouteInstrumentations["lazy.action"]>[];
    "lazy.middleware": NonNullable<RouteInstrumentations["lazy.middleware"]>[];
    middleware: NonNullable<RouteInstrumentations["middleware"]>[];
    loader: NonNullable<RouteInstrumentations["loader"]>[];
    action: NonNullable<RouteInstrumentations["action"]>[];
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
    let lazy = route.lazy;
    updates.lazy = async (...args) => {
      let result = await recurseRight(
        aggregated.lazy,
        undefined,
        () => lazy(...args),
        getInstrumentationInnerResult,
      );
      return throwOrReturnResult(result);
    };
  }

  // Instrument the lazy object format
  if (typeof route.lazy === "object") {
    let lazyObject: LazyRouteObject<DataRouteObject> = route.lazy;

    if (
      typeof lazyObject.middleware === "function" &&
      aggregated["lazy.middleware"].length > 0
    ) {
      let middleware = lazyObject.middleware;
      updates.lazy = Object.assign(updates.lazy || {}, {
        middleware: async (
          ...args: Parameters<
            NonNullable<LazyRouteObject<DataRouteObject>["middleware"]>
          >
        ) => {
          let result = await recurseRight(
            aggregated["lazy.middleware"],
            undefined,
            () => middleware(...args),
            getInstrumentationInnerResult,
          );
          return throwOrReturnResult(result);
        },
      });
    }

    if (
      typeof lazyObject.loader === "function" &&
      aggregated["lazy.loader"].length > 0
    ) {
      let loader = lazyObject.loader;
      updates.lazy = Object.assign(updates.lazy || {}, {
        loader: async (
          ...args: Parameters<
            NonNullable<LazyRouteObject<DataRouteObject>["loader"]>
          >
        ) => {
          let result = await recurseRight(
            aggregated["lazy.loader"],
            undefined,
            () => loader(...args),
            getInstrumentationInnerResult,
          );
          return throwOrReturnResult(result);
        },
      });
    }

    if (
      typeof lazyObject.action === "function" &&
      aggregated["lazy.action"].length > 0
    ) {
      let action = lazyObject.action;
      updates.lazy = Object.assign(updates.lazy || {}, {
        action: async (
          ...args: Parameters<
            NonNullable<LazyRouteObject<DataRouteObject>["action"]>
          >
        ) => {
          let result = await recurseRight(
            aggregated["lazy.action"],
            undefined,
            () => action(...args),
            getInstrumentationInnerResult,
          );
          return throwOrReturnResult(result);
        },
      });
    }
  }

  // Instrument loader/action functions
  if (typeof route.loader === "function" && aggregated.loader.length > 0) {
    let original = getUninstrumentedHandler(route.loader);
    let instrumented = async (...args: Parameters<typeof original>) => {
      let result = await recurseRight(
        aggregated.loader,
        getHandlerInfo(args[0]),
        () => original(...args),
        getInstrumentationInnerResult,
      );
      return throwOrReturnResult(result);
    };
    if (original.hydrate === true) {
      (instrumented as LoaderFunction).hydrate = true;
    }
    setUninstrumentedHandler(instrumented, original);
    updates.loader = instrumented;
  }

  if (typeof route.action === "function" && aggregated.action.length > 0) {
    let original = getUninstrumentedHandler(route.action);
    let instrumented = async (...args: Parameters<typeof original>) => {
      let result = await recurseRight(
        aggregated.action,
        getHandlerInfo(args[0]),
        () => original(...args),
        getInstrumentationInnerResult,
      );
      return throwOrReturnResult(result);
    };
    setUninstrumentedHandler(instrumented, original);
    updates.action = instrumented;
  }

  // Instrument middleware functions
  if (
    route.middleware &&
    route.middleware.length > 0 &&
    aggregated.middleware.length > 0
  ) {
    updates.middleware = route.middleware.map((middleware) => {
      let original = getUninstrumentedHandler(middleware);
      let instrumented = async (...args: Parameters<typeof original>) => {
        let result = await recurseRight(
          aggregated.middleware,
          getHandlerInfo(args[0]),
          () => original(...args),
          getInstrumentationInnerResult,
        );
        return throwOrReturnResult(result);
      };
      setUninstrumentedHandler(instrumented, original);
      return instrumented;
    });
  }

  return updates;
}

export function instrumentClientSideRouter(
  router: Router,
  fns: InstrumentRouterFunction[],
): Router {
  let aggregated: {
    navigate: NonNullable<RouterInstrumentations["navigate"]>[];
    fetch: NonNullable<RouterInstrumentations["fetch"]>[];
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
    let instrumentedNavigate = async (
      ...args: Parameters<typeof navigate>
    ): Promise<Awaited<ReturnType<typeof navigate>>> => {
      let [to, opts] = args;
      let meta: InstrumentationResultMeta | undefined;
      let info: RouterNavigationInstrumentationInfo = {
        to:
          typeof to === "number" || typeof to === "string"
            ? to
            : to
              ? createPath(to)
              : ".",
        ...getRouterInfo(router, opts ?? {}),
      };
      let result = await recurseRight(
        aggregated.navigate,
        info,
        async () => {
          if (typeof to === "number") {
            return await navigate(...args);
          }
          let cleanup = setInstrumentationClientResultMetaReceiver(
            router,
            (value) => {
              meta = value;
            },
          );
          try {
            return await navigate(...args);
          } finally {
            cleanup();
          }
        },
        (result): InstrumentationClientRouterResult => ({
          ...getInstrumentationInnerResult(result),
          meta,
        }),
      );
      return throwOrReturnResult(result);
    };
    setUninstrumentedHandler(instrumentedNavigate, navigate);
    router.navigate = instrumentedNavigate as Router["navigate"];
  }

  if (aggregated.fetch.length > 0) {
    let fetch = getUninstrumentedHandler(router.fetch);
    let instrumentedFetch = async (...args: Parameters<typeof fetch>) => {
      let [key, _, href, opts] = args;
      let meta: InstrumentationResultMeta | undefined;
      let result = await recurseRight(
        aggregated.fetch,
        {
          href: href ?? ".",
          fetcherKey: key,
          ...getRouterInfo(router, opts ?? {}),
        } satisfies RouterFetchInstrumentationInfo,
        async () => {
          let cleanup = setInstrumentationClientResultMetaReceiver(
            router,
            (value) => {
              meta = value;
            },
          );
          try {
            return await fetch(...args);
          } finally {
            cleanup();
          }
        },
        (result): InstrumentationClientRouterResult => ({
          ...getInstrumentationInnerResult(result),
          meta,
        }),
      );
      return throwOrReturnResult(result);
    };
    setUninstrumentedHandler(instrumentedFetch, fetch);
    router.fetch = instrumentedFetch;
  }

  return router;
}

export function instrumentHandler(
  handler: RequestHandler,
  fns: InstrumentRequestHandlerFunction[],
): RequestHandler {
  let aggregated: {
    request: InstrumentFunction<
      RequestHandlerInstrumentationInfo,
      InstrumentationServerHandlerResult
    >[];
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
    instrumentedHandler = async (...args) => {
      let [request, context] = args;
      let instrumentationContext = context ?? new RouterContextProvider();
      let result = await recurseRight(
        aggregated.request,
        {
          request: getReadonlyRequest(request),
          context: getReadonlyContext(instrumentationContext),
        } satisfies RequestHandlerInstrumentationInfo,
        () => handler(request, instrumentationContext),
        (result, info) => {
          let meta: InstrumentationResultMeta | undefined;
          try {
            meta = info.context?.get(instrumentationResultMetaContext);
          } catch {
            // Not all instrumentation contexts have request/route metadata.
          }
          invariant(
            result.value instanceof Response,
            "Expected a Response from the request handler",
          );
          return {
            ...getInstrumentationInnerResult(result),
            statusCode: result.value.status,
            meta,
          };
        },
      );
      return throwOrReturnResult(result);
    };
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

export function setInstrumentationClientResultMetaReceiver(
  router: Router,
  receiver: InstrumentationMetaReceiver,
): () => void {
  instrumentationClientResultMetaReceivers.set(router, receiver);
  return () => {
    if (instrumentationClientResultMetaReceivers.get(router) === receiver) {
      instrumentationClientResultMetaReceivers.delete(router);
    }
  };
}

export function consumeInstrumentationClientResultMetaReceiver(
  router: Router,
): InstrumentationMetaReceiver | undefined {
  let receiver = instrumentationClientResultMetaReceivers.get(router);
  instrumentationClientResultMetaReceivers.delete(router);
  return receiver;
}

type RecurseResult<TResult> =
  | { type: "success"; value: TResult }
  | { type: "error"; value: unknown };

function throwOrReturnResult<TResult>(result: RecurseResult<TResult>): TResult {
  if (result.type === "error") {
    throw result.value;
  }
  return result.value;
}

async function recurseRight<
  TResult,
  TInfo extends InstrumentationInfo,
  TInnerResult extends InstrumentationHandlerResult,
>(
  impls: InstrumentFunction<TInfo, TInnerResult>[],
  info: TInfo,
  handler: () => MaybePromise<TResult>,
  getInnerResult: (result: RecurseResult<TResult>, info: TInfo) => TInnerResult,
  state: RecurseState<TResult, TInnerResult> = {
    result: null,
    innerResult: null,
  },
  index = impls.length - 1,
): Promise<RecurseResult<TResult>> {
  let impl = impls[index];
  if (!impl) {
    try {
      let value = await handler();
      state.result = { type: "success", value };
    } catch (e) {
      state.result = { type: "error", value: e };
    }
    state.innerResult = getInnerResult(state.result, info);
  } else {
    // If they forget to call the handler, or if they throw before calling the
    // handler, we need to ensure the handlers still gets called
    let handlerPromise: Promise<RecurseResult<TResult>> | undefined = undefined;
    let callHandler = async (): Promise<TInnerResult> => {
      if (handlerPromise) {
        console.error("You cannot call instrumented handlers more than once");
      } else {
        handlerPromise = recurseRight(
          impls,
          info,
          handler,
          getInnerResult,
          state,
          index - 1,
        );
      }
      await handlerPromise;
      invariant(state.innerResult, "Expected an inner result");
      return state.innerResult;
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

  if (state.result) {
    return state.result;
  }

  state.result = {
    type: "error",
    value: new Error("No result assigned in instrumentation chain."),
  };
  state.innerResult = getInnerResult(state.result, info);
  return state.result;
}

type RecurseState<TResult, TInnerResult> = {
  result: RecurseResult<TResult> | null;
  innerResult: TInnerResult | null;
};

function getInstrumentationInnerResult<TResult>(
  result: RecurseResult<TResult>,
): InstrumentationHandlerResult {
  if (result.type === "error" && result.value instanceof Error) {
    return { status: "error", error: result.value };
  }
  return { status: "success", error: undefined };
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
