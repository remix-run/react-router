
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
type InstrumentationHandlerResult = {
  status: "success";
  error: undefined;
} | {
  status: "error";
  error: Error;
};
type InstrumentFunction<T> = (handler: () => Promise<InstrumentationHandlerResult>, info: T) => Promise<void>;
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
type RouteHandlerInstrumentationInfo = Readonly<{
  request: ReadonlyRequest;
  params: LoaderFunctionArgs["params"];
  pattern: string;
  context: ReadonlyContext;
}>;
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
//#endregion
export { ClientInstrumentation, InstrumentRequestHandlerFunction, InstrumentRouteFunction, InstrumentRouterFunction, InstrumentationHandlerResult, ServerInstrumentation };