export { createStaticHandler } from "./lib/router/router";
export {
  data,
  matchRoutes,
  redirect,
  redirectDocument,
  replace,
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
