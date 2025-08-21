// RSC APIs
export { matchRSCServerRequest as unstable_matchRSCServerRequest } from "./lib/rsc/server.rsc";

export type {
  DecodeActionFunction as unstable_DecodeActionFunction,
  DecodeFormStateFunction as unstable_DecodeFormStateFunction,
  DecodeReplyFunction as unstable_DecodeReplyFunction,
  LoadServerActionFunction as unstable_LoadServerActionFunction,
  RSCManifestPayload as unstable_RSCManifestPayload,
  RSCMatch as unstable_RSCMatch,
  RSCPayload as unstable_RSCPayload,
  RSCRenderPayload as unstable_RSCRenderPayload,
  RSCRouteManifest as unstable_RSCRouteManifest,
  RSCRouteMatch as unstable_RSCRouteMatch,
  RSCRouteConfigEntry as unstable_RSCRouteConfigEntry,
  RSCRouteConfig as unstable_RSCRouteConfig,
} from "./lib/rsc/server.rsc";

// RSC implementation of agnostic APIs
export { redirect, redirectDocument, replace } from "./lib/rsc/server.rsc";

// Client references
export {
  Await,
  BrowserRouter,
  Form,
  HashRouter,
  Link,
  Links,
  MemoryRouter,
  Meta,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Router,
  RouterProvider,
  Routes,
  ScrollRestoration,
  StaticRouter,
  StaticRouterProvider,
  unstable_HistoryRouter,
} from "react-router/internal/react-server-client";

// Shared implementation of agnostic APIs
export { createStaticHandler } from "./lib/router/router";
export {
  data,
  matchRoutes,
  isRouteErrorResponse,
  createContext,
  RouterContextProvider,
} from "./lib/router/utils";

export { createCookie, isCookie } from "./lib/server-runtime/cookies";
export {
  createSession,
  createSessionStorage,
  isSession,
} from "./lib/server-runtime/sessions";
export { createCookieSessionStorage } from "./lib/server-runtime/sessions/cookieStorage";
export { createMemorySessionStorage } from "./lib/server-runtime/sessions/memoryStorage";

export type {
  MiddlewareFunction,
  MiddlewareNextFunction,
  RouterContext,
} from "./lib/router/utils";

export type {
  Cookie,
  CookieOptions,
  CookieParseOptions,
  CookieSerializeOptions,
  CookieSignatureOptions,
  IsCookieFunction,
} from "./lib/server-runtime/cookies";
export type {
  IsSessionFunction,
  Session,
  SessionData,
  SessionIdStorageStrategy,
  SessionStorage,
  FlashSessionData,
} from "./lib/server-runtime/sessions";
