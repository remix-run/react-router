import type { RequestHandler } from "../server-runtime/server";
import { createPath, invariant } from "./history";
import type { Router } from "./router";
import {
  createContext,
  DataWithResponseInit,
  isRouteErrorResponse,
  joinPaths,
} from "./utils";
import type {
  ActionFunctionArgs,
  DataRouteObject,
  DataRouteMatch,
  FormEncType,
  HTMLFormMethod,
  LazyRouteObject,
  LoaderFunction,
  LoaderFunctionArgs,
  MaybePromise,
  MiddlewareFunction,
  Params,
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

export type InstrumentationHandlerResultWithMeta =
  | {
      status: "success";
      error: undefined;
      meta: InstrumentationResultMeta | undefined;
    }
  | {
      status: "error";
      error: Error;
      meta: InstrumentationResultMeta | undefined;
    };

export type InstrumentationRequestHandlerResult =
  | {
      status: "success";
      error: undefined;
      statusCode: number | undefined;
      meta: InstrumentationResultMeta | undefined;
    }
  | {
      status: "error";
      error: Error;
      statusCode: number | undefined;
      meta: InstrumentationResultMeta | undefined;
    };

export type InstrumentationResultMeta = {
  url: string;
  pattern: string;
  params: Params;
};

// Shared
type InstrumentFunction<T, TResult = InstrumentationHandlerResult> = (
  handler: () => Promise<TResult>,
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
    InstrumentationHandlerResultWithMeta
  >;
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
  request?: InstrumentFunction<
    RequestHandlerInstrumentationInfo,
    InstrumentationRequestHandlerResult
  >;
};

type RequestHandlerInstrumentationInfo = Readonly<{
  request: ReadonlyRequest;
  context: ReadonlyContext | undefined;
}>;

const UninstrumentedSymbol = Symbol("Uninstrumented");
const InstrumentationResultMetaSymbol = Symbol("InstrumentationResultMeta");

type InstrumentationResultMetaAccessor = {
  [InstrumentationResultMetaSymbol]?: () => InstrumentationResultMeta;
};

export const instrumentationResultMetaContext =
  createContext<InstrumentationResultMeta>();

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
    let instrumented = wrapImpl(
      aggregated.lazy,
      route.lazy,
      () => undefined,
      getInstrumentationHandlerResult,
    );
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
        getInstrumentationHandlerResult,
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
        getInstrumentationHandlerResult,
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
        getInstrumentationHandlerResult,
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
    let instrumented = wrapImpl(
      aggregated.loader,
      original,
      (args) => getHandlerInfo(args),
      getInstrumentationHandlerResult,
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
    let instrumented = wrapImpl(
      aggregated.action,
      original,
      (args) => getHandlerInfo(args),
      getInstrumentationHandlerResult,
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
      let instrumented = wrapImpl(
        aggregated.middleware,
        original,
        (args) => getHandlerInfo(args),
        getInstrumentationHandlerResult,
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
    navigate: InstrumentFunction<
      RouterNavigationInstrumentationInfo,
      InstrumentationHandlerResultWithMeta
    >[];
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
        let info: RouterNavigationInstrumentationInfo &
          InstrumentationResultMetaAccessor = {
          to:
            typeof to === "number" || typeof to === "string"
              ? to
              : to
                ? createPath(to)
                : ".",
          ...getRouterInfo(router, opts ?? {}),
        };
        Object.defineProperty(info, InstrumentationResultMetaSymbol, {
          value: () =>
            getInstrumentationResultMeta(
              createPath(router.state.location),
              router.state.matches,
            ),
        });
        return info;
      },
      getInstrumentationHandlerResultWithMeta,
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
      getInstrumentationHandlerResult,
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
    request: InstrumentFunction<
      RequestHandlerInstrumentationInfo,
      InstrumentationRequestHandlerResult
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
    let instrumented = wrapImpl(
      aggregated.request,
      handler,
      (request, context) => {
        return {
          request: getReadonlyRequest(request),
          context: context != null ? getReadonlyContext(context) : context,
        } satisfies RequestHandlerInstrumentationInfo;
      },
      getInstrumentationRequestHandlerResult,
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
  THandlerResult extends InstrumentationHandlerResult,
>(
  impls: InstrumentFunction<TInfo, THandlerResult>[],
  handler: (...args: TArgs) => MaybePromise<TResult>,
  getInfo: (...args: TArgs) => TInfo,
  getHandlerResult: (
    result: RecurseResult<TResult>,
    info: TInfo,
  ) => THandlerResult,
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
      getHandlerResult,
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

async function recurseRight<
  TResult,
  TInfo extends InstrumentationInfo,
  THandlerResult extends InstrumentationHandlerResult,
>(
  impls: InstrumentFunction<TInfo, THandlerResult>[],
  info: TInfo,
  handler: () => MaybePromise<TResult>,
  index: number,
  getHandlerResult: (
    result: RecurseResult<TResult>,
    info: TInfo,
  ) => THandlerResult,
): Promise<RecurseState<TResult, THandlerResult>> {
  let impl = impls[index];
  let result: RecurseState<TResult, THandlerResult> | undefined;
  if (!impl) {
    let handlerResult: RecurseResult<TResult>;
    try {
      let value = await handler();
      handlerResult = { type: "success", value };
    } catch (e) {
      handlerResult = { type: "error", value: e };
    }
    result = {
      ...handlerResult,
      handlerResult: getHandlerResult(handlerResult, info),
    };
  } else {
    // If they forget to call the handler, or if they throw before calling the
    // handler, we need to ensure the handlers still gets called
    let handlerPromise: Promise<RecurseState<TResult, THandlerResult>> | undefined =
      undefined;
    let callHandler = async (): Promise<THandlerResult> => {
      if (handlerPromise) {
        console.error("You cannot call instrumented handlers more than once");
      } else {
        handlerPromise = recurseRight(
          impls,
          info,
          handler,
          index - 1,
          getHandlerResult,
        );
      }
      result = await handlerPromise;
      invariant(result, "Expected a result");
      return result.handlerResult;
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

  let resultWithoutInstrumentation: RecurseResult<TResult> = {
    type: "error",
    value: new Error("No result assigned in instrumentation chain."),
  };
  return {
    ...resultWithoutInstrumentation,
    handlerResult: getHandlerResult(resultWithoutInstrumentation, info),
  };
}

type RecurseState<TResult, THandlerResult> = RecurseResult<TResult> & {
  handlerResult: THandlerResult;
};

function getInstrumentationHandlerResult<TResult>(
  result: RecurseResult<TResult>,
): InstrumentationHandlerResult {
  if (result.type === "error" && result.value instanceof Error) {
    return { status: "error", error: result.value };
  }
  return { status: "success", error: undefined };
}

function getInstrumentationHandlerResultWithMeta<
  TResult,
  TInfo extends InstrumentationInfo,
>(
  result: RecurseResult<TResult>,
  info: TInfo,
): InstrumentationHandlerResultWithMeta {
  return {
    ...getInstrumentationHandlerResult(result),
    meta: getInstrumentationMeta(info),
  };
}

function getInstrumentationRequestHandlerResult<
  TResult,
  TInfo extends InstrumentationInfo,
>(
  result: RecurseResult<TResult>,
  info: TInfo,
): InstrumentationRequestHandlerResult {
  return {
    ...getInstrumentationHandlerResult(result),
    statusCode: getStatusCode(result.value),
    meta: getInstrumentationMeta(info),
  };
}

function getInstrumentationMeta<T extends InstrumentationInfo>(
  info: T,
): InstrumentationResultMeta | undefined {
  if (info && typeof info === "object") {
    if (hasInstrumentationResultMetaAccessor(info)) {
      let readResultMeta = info[InstrumentationResultMetaSymbol];
      if (readResultMeta) {
        return readResultMeta();
      }
    }

    if ("context" in info && info.context) {
      try {
        return info.context.get(instrumentationResultMetaContext);
      } catch {
        // Not all instrumentation contexts have request/route metadata.
      }
    }
  }

  return undefined;
}

function hasInstrumentationResultMetaAccessor(
  value: object,
): value is InstrumentationResultMetaAccessor {
  return InstrumentationResultMetaSymbol in value;
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

export function getInstrumentationResultMeta(
  url: string,
  matches: RouteLikeMatch[] | null | undefined,
): InstrumentationResultMeta {
  return {
    url,
    pattern: matches ? getPattern(matches) : "",
    params: matches?.[0]?.params ? { ...matches[0].params } : {},
  };
}

type RouteLikeMatch = Pick<DataRouteMatch, "params" | "pathname"> & {
  pathnameBase?: string;
  route: Pick<DataRouteMatch["route"], "id" | "path">;
};

function getPattern(matches: RouteLikeMatch[]) {
  let parts = matches.map((m) => m.route.path).filter(isRoutePath);
  return joinPaths(parts) || "/";
}

function isRoutePath(path: string | undefined): path is string {
  return Boolean(path);
}

function getStatusCode(value: unknown): number | undefined {
  if (typeof Response !== "undefined" && value instanceof Response) {
    return value.status;
  }

  if (value instanceof DataWithResponseInit) {
    return value.init?.status;
  }

  if (isRouteErrorResponse(value)) {
    return value.status;
  }

  return undefined;
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
