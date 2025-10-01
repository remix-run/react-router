import type { RequestHandler } from "../server-runtime/server";
import { createPath } from "./history";
import type { Router } from "./router";
import type {
  ActionFunctionArgs,
  AgnosticDataRouteObject,
  FormEncType,
  HTMLFormMethod,
  LazyRouteObject,
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

// Shared
interface GenericInstrumentFunction {
  (handler: () => Promise<void>, info: unknown): Promise<void>;
}

// Route Instrumentation
type InstrumentableRoute = {
  id: string;
  index: boolean | undefined;
  path: string | undefined;
  instrument(instrumentations: RouteInstrumentations): void;
};

type RouteInstrumentations = {
  lazy?: InstrumentLazyFunction;
  "lazy.loader"?: InstrumentLazyFunction;
  "lazy.action"?: InstrumentLazyFunction;
  "lazy.middleware"?: InstrumentLazyFunction;
  middleware?: InstrumentRouteHandlerFunction;
  loader?: InstrumentRouteHandlerFunction;
  action?: InstrumentRouteHandlerFunction;
};

type RouteHandlerInstrumentationInfo = Readonly<{
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

interface InstrumentLazyFunction extends GenericInstrumentFunction {
  (handler: () => Promise<void>): Promise<void>;
}

interface InstrumentRouteHandlerFunction extends GenericInstrumentFunction {
  (
    handler: () => Promise<void>,
    info: RouteHandlerInstrumentationInfo,
  ): Promise<void>;
}

// Router Instrumentation
type InstrumentableRouter = {
  instrument(instrumentations: RouterInstrumentations): void;
};

type RouterInstrumentations = {
  navigate?: InstrumentNavigateFunction;
  fetch?: InstrumentFetchFunction;
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

interface InstrumentNavigateFunction extends GenericInstrumentFunction {
  (
    handler: () => Promise<void>,
    info: RouterNavigationInstrumentationInfo,
  ): MaybePromise<void>;
}

interface InstrumentFetchFunction extends GenericInstrumentFunction {
  (
    handler: () => Promise<void>,
    info: RouterFetchInstrumentationInfo,
  ): MaybePromise<void>;
}

// Request Handler Instrumentation
type InstrumentableRequestHandler = {
  instrument(instrumentations: RequestHandlerInstrumentations): void;
};

type RequestHandlerInstrumentations = {
  request?: InstrumentRequestHandlerFunction;
};

type RequestHandlerInstrumentationInfo = Readonly<{
  request: {
    method: string;
    url: string;
    headers: Pick<Headers, "get">;
  };
  // TODO: Fix for non-middleware
  context: Pick<RouterContextProvider, "get">;
}>;

interface InstrumentRequestHandlerFunction extends GenericInstrumentFunction {
  (
    handler: () => Promise<void>,
    info: RequestHandlerInstrumentationInfo,
  ): MaybePromise<void>;
}

const UninstrumentedSymbol = Symbol("Uninstrumented");

function getInstrumentedImplementation(
  impls: GenericInstrumentFunction[],
  handler: (...args: any[]) => Promise<any>,
  getInfo: (...args: unknown[]) => unknown = () => undefined,
) {
  if (impls.length === 0) {
    return null;
  }
  return async (...args: unknown[]) => {
    let value: unknown;
    let info = getInfo(...args);
    await recurseRight(
      impls,
      info,
      async () => {
        value = await handler(...args);
      },
      impls.length - 1,
    );
    return value;
  };
}

async function recurseRight(
  impls: GenericInstrumentFunction[],
  info: Parameters<GenericInstrumentFunction>[1] | undefined,
  handler: () => MaybePromise<void>,
  index: number,
): Promise<void> {
  let impl = impls[index];
  if (!impl) {
    await handler();
  } else {
    await impl(async () => {
      await recurseRight(impls, info, handler, index - 1);
    }, info);
  }
}

function getInstrumentationInfo(
  args: LoaderFunctionArgs,
): RouteHandlerInstrumentationInfo {
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

function getInstrumentationsByType<
  T extends
    | RouteInstrumentations
    | RouterInstrumentations
    | RequestHandlerInstrumentations,
  K extends keyof T,
>(instrumentations: T[], key: K): GenericInstrumentFunction[] {
  let value: GenericInstrumentFunction[] = [];
  for (let i in instrumentations) {
    let instrumentation = instrumentations[i];
    if (key in instrumentation && instrumentation[key] != null) {
      value.push(instrumentation[key] as GenericInstrumentFunction);
    }
  }
  return value;
}

export function getInstrumentationUpdates(
  fns: unstable_InstrumentRouteFunction[],
  route: Readonly<AgnosticDataRouteObject>,
) {
  let instrumentations: RouteInstrumentations[] = [];
  fns.forEach((fn) =>
    fn({
      id: route.id,
      index: route.index,
      path: route.path,
      instrument(i) {
        instrumentations.push(i);
      },
    }),
  );

  let updates: {
    middleware?: AgnosticDataRouteObject["middleware"];
    loader?: AgnosticDataRouteObject["loader"];
    action?: AgnosticDataRouteObject["action"];
    lazy?: AgnosticDataRouteObject["lazy"];
  } = {};

  if (instrumentations.length > 0) {
    // Instrument lazy, loader, and action functions
    (["lazy", "loader", "action"] as const).forEach((key) => {
      let func = route[key];
      if (typeof func === "function") {
        // @ts-expect-error
        let original = func[UninstrumentedSymbol] ?? func;
        let instrumented = getInstrumentedImplementation(
          getInstrumentationsByType(instrumentations, key),
          original,
          key === "lazy"
            ? () => undefined
            : (...args) =>
                getInstrumentationInfo(
                  args[0] as LoaderFunctionArgs | ActionFunctionArgs,
                ),
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
      updates.middleware = route.middleware.map((middleware) => {
        // @ts-expect-error
        let original = middleware[UninstrumentedSymbol] ?? middleware;
        let instrumented = getInstrumentedImplementation(
          getInstrumentationsByType(instrumentations, "middleware"),
          original,
          (...args) =>
            getInstrumentationInfo(
              args[0] as Parameters<MiddlewareFunction>[0],
            ),
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

export function instrumentClientSideRouter(
  router: Router,
  fns: unstable_InstrumentRouterFunction[],
): Router {
  let instrumentations: RouterInstrumentations[] = [];
  fns.forEach((fn) =>
    fn({
      instrument(i) {
        instrumentations.push(i);
      },
    }),
  );

  if (instrumentations.length > 0) {
    // @ts-expect-error
    let navigate = router.navigate[UninstrumentedSymbol] ?? router.navigate;
    let instrumentedNavigate = getInstrumentedImplementation(
      getInstrumentationsByType(instrumentations, "navigate"),
      navigate,
      (...args) => {
        let [to, opts] = args as Parameters<Router["navigate"]>;
        opts = opts ?? {};
        let info: RouterNavigationInstrumentationInfo = {
          to:
            typeof to === "number" || typeof to === "string"
              ? to
              : to
                ? createPath(to)
                : ".",
          currentUrl: createPath(router.state.location),
          ...("formMethod" in opts ? { formMethod: opts.formMethod } : {}),
          ...("formEncType" in opts ? { formEncType: opts.formEncType } : {}),
          ...("formData" in opts ? { formData: opts.formData } : {}),
          ...("body" in opts ? { body: opts.body } : {}),
        };
        return info;
      },
    ) as Router["navigate"];
    if (instrumentedNavigate) {
      // @ts-expect-error
      instrumentedNavigate[UninstrumentedSymbol] = navigate;
      router.navigate = instrumentedNavigate;
    }

    // @ts-expect-error
    let fetch = router.fetch[UninstrumentedSymbol] ?? router.fetch;
    let instrumentedFetch = getInstrumentedImplementation(
      getInstrumentationsByType(instrumentations, "fetch"),
      fetch,
      (...args) => {
        let [key, , href, opts] = args as Parameters<Router["fetch"]>;
        opts = opts ?? {};
        let info: RouterFetchInstrumentationInfo = {
          href: href ?? ".",
          currentUrl: createPath(router.state.location),
          fetcherKey: key,
          ...("formMethod" in opts ? { formMethod: opts.formMethod } : {}),
          ...("formEncType" in opts ? { formEncType: opts.formEncType } : {}),
          ...("formData" in opts ? { formData: opts.formData } : {}),
          ...("body" in opts ? { body: opts.body } : {}),
        };
        return info;
      },
    ) as Router["fetch"];
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
  let instrumentations: RequestHandlerInstrumentations[] = [];
  fns.forEach((fn) =>
    fn({
      instrument(i) {
        instrumentations.push(i);
      },
    }),
  );

  if (instrumentations.length === 0) {
    return handler;
  }

  let instrumentedHandler = getInstrumentedImplementation(
    getInstrumentationsByType(instrumentations, "request"),
    handler,
    (...args) => {
      let [request, context] = args as Parameters<RequestHandler>;
      let info: RequestHandlerInstrumentationInfo = {
        request: {
          method: request.method,
          url: request.url,
          headers: {
            get: (...args) => request.headers.get(...args),
          },
        },
        context: {
          get: <T>(ctx: RouterContext<T>) =>
            context
              ? (context as unknown as RouterContextProvider).get(ctx)
              : (undefined as T),
        },
      };
      return info;
    },
  ) as RequestHandler;

  return instrumentedHandler ?? handler;
}
