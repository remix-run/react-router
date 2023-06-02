import sourceMapSupport from "source-map-support";

sourceMapSupport.install();

export { AbortController } from "abort-controller";

export type {
  HeadersInit,
  RequestInfo,
  RequestInit,
  ResponseInit,
} from "./fetch";
export { fetch, FormData, Headers, Request, Response } from "./fetch";

export { installGlobals } from "./globals";

export { createFileSessionStorage } from "./sessions/fileStorage";

export {
  createFileUploadHandler as unstable_createFileUploadHandler,
  NodeOnDiskFile,
} from "./upload/fileUploadHandler";

export {
  createCookie,
  createCookieSessionStorage,
  createMemorySessionStorage,
  createSessionStorage,
} from "./implementations";

export {
  createReadableStreamFromReadable,
  readableStreamToString,
  writeAsyncIterableToWritable,
  writeReadableStreamToWritable,
} from "./stream";

export {
  createRequestHandler,
  createSession,
  defer,
  broadcastDevReady,
  logDevReady,
  isCookie,
  isSession,
  json,
  MaxPartSizeExceededError,
  redirect,
  unstable_composeUploadHandlers,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/server-runtime";

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
  HeadersArgs,
  HeadersFunction,
  HtmlLinkDescriptor,
  HtmlMetaDescriptor,
  JsonFunction,
  LinkDescriptor,
  LinksFunction,
  LoaderArgs,
  LoaderFunction,
  MemoryUploadHandlerFilterArgs,
  MemoryUploadHandlerOptions,
  MetaDescriptor,
  MetaFunction,
  HandleErrorFunction,
  PageLinkDescriptor,
  RequestHandler,
  RouteComponent,
  RouteHandle,
  SerializeFrom,
  ServerBuild,
  ServerEntryModule,
  V2_ServerRuntimeMetaArgs as V2_MetaArgs,
  V2_ServerRuntimeMetaDescriptor as V2_MetaDescriptor,
  // TODO: Remove in v2
  V2_ServerRuntimeMetaDescriptor as V2_HtmlMetaDescriptor,
  V2_ServerRuntimeMetaFunction as V2_MetaFunction,
  Session,
  SessionData,
  SessionIdStorageStrategy,
  SessionStorage,
  SignFunction,
  TypedDeferredData,
  TypedResponse,
  UnsignFunction,
  UploadHandler,
  UploadHandlerPart,
} from "@remix-run/server-runtime";
