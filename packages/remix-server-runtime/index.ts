// Default implementations for the Remix server runtime interface
export { createCookieFactory, isCookie } from "./cookies";
export {
  composeUploadHandlers as unstable_composeUploadHandlers,
  parseMultipartFormData as unstable_parseMultipartFormData,
} from "./formData";
export { json, redirect } from "./responses";
export { createRequestHandler } from "./server";
export {
  createSession,
  createSessionStorageFactory,
  isSession,
} from "./sessions";
export { createCookieSessionStorageFactory } from "./sessions/cookieStorage";
export { createMemorySessionStorageFactory } from "./sessions/memoryStorage";
export { createMemoryUploadHandler as unstable_createMemoryUploadHandler } from "./upload/memoryUploadHandler";
export { MaxPartSizeExceededError } from "./upload/errors";

// Types for the Remix server runtime interface
export type {
  CreateCookieFunction,
  CreateCookieSessionStorageFunction,
  CreateMemorySessionStorageFunction,
  CreateRequestHandlerFunction,
  CreateSessionFunction,
  CreateSessionStorageFunction,
  IsCookieFunction,
  IsSessionFunction,
  JsonFunction,
  RedirectFunction,
} from "./interface";

// Remix server runtime packages should re-export these types
export type {
  ActionArgs,
  ActionFunction,
  AppData,
  AppLoadContext,
  Cookie,
  CookieOptions,
  CookieParseOptions,
  CookieSerializeOptions,
  CookieSignatureOptions,
  DataFunctionArgs,
  EntryContext,
  ErrorBoundaryComponent,
  HandleDataRequestFunction,
  HandleDocumentRequestFunction,
  HeadersFunction,
  HtmlLinkDescriptor,
  HtmlMetaDescriptor,
  LinkDescriptor,
  LinksFunction,
  LoaderArgs,
  LoaderFunction,
  MemoryUploadHandlerFilterArgs,
  MemoryUploadHandlerOptions,
  MetaDescriptor,
  MetaFunction,
  PageLinkDescriptor,
  RequestHandler,
  RouteComponent,
  RouteHandle,
  SerializeFrom,
  ServerBuild,
  ServerEntryModule,
  Session,
  SessionData,
  SessionIdStorageStrategy,
  SessionStorage,
  SignFunction,
  TypedResponse,
  UnsignFunction,
  UploadHandler,
  UploadHandlerPart,
} from "./reexport";

export type {
  AgnosticDataRouteObject,
  AgnosticIndexRouteObject,
  AgnosticNonIndexRouteObject,
  AgnosticRouteObject,
  InitialEntry,
  Location,
  MemoryHistory,
  StaticHandler,
} from "./router";
export {
  createMemoryHistory,
  matchRoutes,
  unstable_createStaticHandler,
} from "./router";
export type { Update } from "./router/history";
export type { AgnosticRouteMatch } from "./router/utils";
