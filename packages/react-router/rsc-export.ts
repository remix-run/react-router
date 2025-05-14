export { createStaticHandler } from "./lib/router/router";
export type {
  unstable_MiddlewareFunction,
  unstable_MiddlewareNextFunction,
  unstable_RouterContext,
  unstable_RouterContextProvider,
} from "./lib/router/utils";
export {
  data,
  matchRoutes,
  redirect,
  redirectDocument,
  replace,
  unstable_createContext,
} from "./lib/router/utils";

export type {
  Cookie,
  CookieOptions,
  CookieParseOptions,
  CookieSerializeOptions,
  CookieSignatureOptions,
  IsCookieFunction,
} from "./lib/server-runtime/cookies";
export { createCookie, isCookie } from "./lib/server-runtime/cookies";
export type {
  IsSessionFunction,
  Session,
  SessionData,
  SessionIdStorageStrategy,
  SessionStorage,
  FlashSessionData,
} from "./lib/server-runtime/sessions";
export {
  createSession,
  createSessionStorage,
  isSession,
} from "./lib/server-runtime/sessions";
export { createCookieSessionStorage } from "./lib/server-runtime/sessions/cookieStorage";
export { createMemorySessionStorage } from "./lib/server-runtime/sessions/memoryStorage";

export type {
  DecodeCallServerFunction,
  DecodeFormActionFunction,
  ServerManifestPayload,
  ServerMatch,
  ServerPayload,
  ServerRenderPayload,
  RenderedRoute as ServerRouteManifest,
  ServerRouteMatch,
  ServerRouteObject,
} from "./lib/rsc/server.rsc";
export { matchRSCServerRequest } from "./lib/rsc/server.rsc";
