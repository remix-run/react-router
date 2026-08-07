
import { FormEncType, HTMLFormMethod, LoaderFunctionArgs, RouterContextProvider } from "./utils.js";
//#region lib/router/instrumentation.d.ts
type ServerInstrumentation = {
  handler?: InstrumentRequestHandlerFunction;
  route?: InstrumentRouteFunction;
};
type ClientInstrumentation = {
  router?: InstrumentRouterFunction;
  route?: InstrumentRouteFunction;
};
type InstrumentRequestHandlerFunction = (handler: InstrumentableRequestHandler) => void;
type InstrumentRouterFunction = (router: InstrumentableRouter) => void;
type InstrumentRouteFunction = (route: InstrumentableRoute) => void;
/**
 * Route metadata available after React Router has matched an instrumented
 * request, navigation, or fetcher call.
 */
type InstrumentationResultMeta = {
  url: LoaderFunctionArgs["url"];
  pattern: string;
  params: LoaderFunctionArgs["params"];
};
/**
 * Result returned by route-level instrumented handler calls, such as
 * instrumented loaders, actions, middleware, and lazy route functions.
 */
type InstrumentationHandlerResult = {
  status: "success";
  error: undefined;
} | {
  status: "error";
  error: Error;
};
/**
 * Result returned by client-side router instrumented navigation and fetcher
 * calls.
 */
type InstrumentationClientRouterResult = InstrumentationHandlerResult & {
  meta: InstrumentationResultMeta | undefined;
};
/**
 * Result returned by server request handler instrumentation.
 */
type InstrumentationServerHandlerResult = InstrumentationHandlerResult & {
  statusCode: number;
  meta: InstrumentationResultMeta | undefined;
};
type InstrumentFunction<T, TInnerResult = InstrumentationHandlerResult> = (handler: () => Promise<TInnerResult>, info: T) => Promise<void>;
type ReadonlyRequest = {
  method: string;
  url: string;
  headers: Pick<Headers, "get">;
};
type ReadonlyContext = Pick<RouterContextProvider, "get">;
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
type RouteHandlerInstrumentationInfo = Readonly<Omit<LoaderFunctionArgs, "request" | "context"> & {
  request: ReadonlyRequest;
  context: ReadonlyContext;
}>;
type InstrumentableRouter = {
  instrument(instrumentations: RouterInstrumentations): void;
};
type RouterInstrumentations = {
  navigate?: InstrumentFunction<RouterNavigationInstrumentationInfo, InstrumentationClientRouterResult>;
  fetch?: InstrumentFunction<RouterFetchInstrumentationInfo, InstrumentationClientRouterResult>;
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
type InstrumentableRequestHandler = {
  instrument(instrumentations: RequestHandlerInstrumentations): void;
};
type RequestHandlerInstrumentations = {
  request?: InstrumentFunction<RequestHandlerInstrumentationInfo, InstrumentationServerHandlerResult>;
};
type RequestHandlerInstrumentationInfo = Readonly<{
  request: ReadonlyRequest;
  context: ReadonlyContext | undefined;
}>;
//#endregion
export { ClientInstrumentation, InstrumentRequestHandlerFunction, InstrumentRouteFunction, InstrumentRouterFunction, InstrumentationClientRouterResult, InstrumentationHandlerResult, InstrumentationServerHandlerResult, ServerInstrumentation };